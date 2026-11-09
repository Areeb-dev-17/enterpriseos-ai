
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
