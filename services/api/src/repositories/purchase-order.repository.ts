
import { pool } from "../config/database.js";

export interface PurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderInput {
  supplierName: string;
  expectedDate?: string | null;
  items: PurchaseOrderItemInput[];
}

export interface ReceivePurchaseOrderInput {
  items: {
    itemId: string;
    quantity: number;
  }[];
}


export const ReceivePurchaseOrder = async (
  purchaseOrderId: string,
  organizationId: string,
  data: ReceivePurchaseOrderInput
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Lock the purchase order.
    // This prevents concurrent receiving requests for the same PO.
    const orderResult = await client.query(
      `
        SELECT id, status
        FROM purchase_orders
        WHERE id = $1
          AND organization_id = $2
        FOR UPDATE
      `,
      [purchaseOrderId, organizationId]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const order = orderResult.rows[0];

    if (
      !["Pending", "Approved", "Partially Received"].includes(
        order.status
      )
    ) {
      throw new Error(
        `Cannot receive a purchase order with status: ${order.status}`
      );
    }

    // 2. Lock all items belonging to this purchase order.
    const itemsResult = await client.query(
      `
        SELECT
          id,
          product_id,
          quantity,
          received_quantity
        FROM purchase_order_items
        WHERE purchase_order_id = $1
          AND organization_id = $2
        ORDER BY product_id
        FOR UPDATE
      `,
      [purchaseOrderId, organizationId]
    );

    const orderItems = itemsResult.rows;

    // 3. Validate requested quantities against remaining quantities.
    const orderItemsMap = new Map(
      orderItems.map((item) => [item.id, item])
    );

    const receivedItemIds = new Set<string>();

    for (const receivedItem of data.items) {
      if (receivedItemIds.has(receivedItem.itemId)) {
        throw new Error(
          "A purchase order item cannot appear more than once"
        );
      }

      receivedItemIds.add(receivedItem.itemId);

      const orderItem = orderItemsMap.get(receivedItem.itemId);

      if (!orderItem) {
        throw new Error(
          "One or more items do not belong to this purchase order"
        );
      }

      const remainingQuantity =
        orderItem.quantity - orderItem.received_quantity;

      if (receivedItem.quantity > remainingQuantity) {
        throw new Error(
          `Cannot receive more than the remaining quantity for item ${receivedItem.itemId}`
        );
      }
    }

    // 4. Update received quantities and inventory.
    // Process in product ID order to reduce deadlock risk.
    const sortedItems = [...data.items].sort((a, b) =>
      orderItemsMap
        .get(a.itemId)!
        .product_id.localeCompare(
          orderItemsMap.get(b.itemId)!.product_id
        )
    );

    for (const receivedItem of sortedItems) {
      const orderItem = orderItemsMap.get(receivedItem.itemId)!;

      await client.query(
        `
          UPDATE purchase_order_items
          SET received_quantity = received_quantity + $1
          WHERE id = $2
            AND purchase_order_id = $3
            AND organization_id = $4
        `,
        [
          receivedItem.quantity,
          receivedItem.itemId,
          purchaseOrderId,
          organizationId,
        ]
      );

      // Atomic stock increment. Never calculate stock in JavaScript
      // and write an old value back to the database.
      const stockResult = await client.query(
        `
          UPDATE products
          SET
            available_stock = available_stock + $1,
            updated_at = NOW()
          WHERE id = $2
            AND organization_id = $3
        `,
        [
          receivedItem.quantity,
          orderItem.product_id,
          organizationId,
        ]
      );

      if (stockResult.rowCount !== 1) {
        throw new Error("Product inventory update failed");
      }
    }

    // 5. Update PO status based on all its received quantities.
    await client.query(
      `
        UPDATE purchase_orders
        SET
          status = CASE
            WHEN NOT EXISTS (
              SELECT 1
              FROM purchase_order_items
              WHERE purchase_order_id = $1
                AND organization_id = $2
                AND received_quantity < quantity
            )
            THEN 'Received'
            ELSE 'Partially Received'
          END,
          updated_at = NOW()
        WHERE id = $1
          AND organization_id = $2
      `,
      [purchaseOrderId, organizationId]
    );

    // 6. Fetch the updated purchase order.
    const result = await client.query(
      `
        ${purchaseOrderSelect}
        WHERE po.id = $1
          AND po.organization_id = $2
        GROUP BY po.id
      `,
      [purchaseOrderId, organizationId]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


// Common query to fetch one PO with all its items.
const purchaseOrderSelect = `
  SELECT
    po.id,
    po.organization_id AS "organizationId",
    po.supplier_name AS "supplierName",
    po.status,
    po.expected_date AS "expectedDate",
    po.created_at AS "createdAt",
    po.updated_at AS "updatedAt",
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', poi.id,
          'productId', poi.product_id,
          'productName', p.product_name,
          'sku', p.sku,
          'quantity', poi.quantity,
          'receivedQuantity', poi.received_quantity,
          'unitCost', poi.unit_cost
        )
      ) FILTER (WHERE poi.id IS NOT NULL),
      '[]'::jsonb
    ) AS items
  FROM purchase_orders po
  LEFT JOIN purchase_order_items poi
    ON poi.purchase_order_id = po.id
    AND poi.organization_id = po.organization_id
  LEFT JOIN products p
    ON p.id = poi.product_id
    AND p.organization_id = poi.organization_id
`;

// Create a purchase order and its items together.
export const createPurchaseOrder = async (
  organizationId: string,
  data: CreatePurchaseOrderInput
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
        INSERT INTO purchase_orders (
          organization_id,
          supplier_name,
          expected_date
        )
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [
        organizationId,
        data.supplierName,
        data.expectedDate ?? null,
      ]
    );

    const purchaseOrderId = orderResult.rows[0].id;

    for (const item of data.items) {
      await client.query(
        `
          INSERT INTO purchase_order_items (
            organization_id,
            purchase_order_id,
            product_id,
            quantity,
            unit_cost
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          organizationId,
          purchaseOrderId,
          item.productId,
          item.quantity,
          item.unitCost,
        ]
      );
    }

    const result = await client.query(
      `
        ${purchaseOrderSelect}
        WHERE po.id = $1
          AND po.organization_id = $2
        GROUP BY po.id
      `,
      [purchaseOrderId, organizationId]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Fetch all purchase orders for one organization.
export const getPurchaseOrders = async (
  organizationId: string
) => {
  const result = await pool.query(
    `
      ${purchaseOrderSelect}
      WHERE po.organization_id = $1
      GROUP BY po.id
      ORDER BY po.created_at DESC
    `,
    [organizationId]
  );

  return result.rows;
};

// Fetch one purchase order with its items.
export const getPurchaseOrderById = async (
  id: string,
  organizationId: string
) => {
  const result = await pool.query(
    `
      ${purchaseOrderSelect}
      WHERE po.id = $1
        AND po.organization_id = $2
      GROUP BY po.id
    `,
    [id, organizationId]
  );

  return result.rows[0] ?? null;
};
