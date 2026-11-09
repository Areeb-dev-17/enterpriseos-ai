
import { pool } from "../config/database.js";

export interface ProductInput {
  productName: string;
  category: string;
  availableStock: number;
  reorderLevel: number;
  unitPrice: number;
}

export interface ProductUpdateInput {
  productName?: string;
  sku?: string;
  category?: string;
  availableStock?: number;
  reorderLevel?: number;
  unitPrice?: number;
}

const productColumns = `
  id,
  organization_id AS "organizationId",
  product_name AS "productName",
  sku,
  category,
  available_stock AS "availableStock",
  reorder_level AS "reorderLevel",
  unit_price AS "unitPrice",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const createProduct = async (
    organizationId: string,
    sku: string,
    data: ProductInput
  ) => {
    const query = `
      INSERT INTO products (
        organization_id,
        product_name,
        sku,
        category,
        available_stock,
        reorder_level,
        unit_price
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${productColumns}
    `;
  
    const values = [
      organizationId,
      data.productName,
      sku,
      data.category,
      data.availableStock,
      data.reorderLevel,
      data.unitPrice,
    ];
  
    const result = await pool.query(query, values);
  
    return result.rows[0];
  };

export const getProducts = async (organizationId: string) => {
  const query = `
    SELECT ${productColumns}
    FROM products
    WHERE organization_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [organizationId]);
  return result.rows;
};

export const getProductById = async (
  id: string,
  organizationId: string
) => {
  const query = `
    SELECT ${productColumns}
    FROM products
    WHERE id = $1 AND organization_id = $2
  `;

  const result = await pool.query(query, [id, organizationId]);
  return result.rows[0] ?? null;
};

export const updateProduct = async (
  id: string,
  organizationId: string,
  data: ProductUpdateInput
) => {
  const columnMap: Record<keyof ProductUpdateInput, string> = {
    productName: "product_name",
    sku: "sku",
    category: "category",
    availableStock: "available_stock",
    reorderLevel: "reorder_level",
    unitPrice: "unit_price",
  };

  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined
  ) as [keyof ProductUpdateInput, string | number][];

  if (entries.length === 0) {
    return getProductById(id, organizationId);
  }

  const setClauses = entries.map(
    ([key], index) => `${columnMap[key]} = $${index + 1}`
  );

  const values = entries.map(([, value]) => value);

  const query = `
    UPDATE products
    SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length + 1}
      AND organization_id = $${values.length + 2}
    RETURNING ${productColumns}
  `;

  values.push(id, organizationId);

  const result = await pool.query(query, values);
  return result.rows[0] ?? null;
};

export const deleteProduct = async (
  id: string,
  organizationId: string
) => {
  const query = `
    DELETE FROM products
    WHERE id = $1 AND organization_id = $2
    RETURNING id
  `;

  const result = await pool.query(query, [id, organizationId]);
  return result.rows[0] ?? null;
};

export const generateProductSku = async (
    organizationId: string,
    prefix: string
  ): Promise<string> => {
    const query = `
      INSERT INTO sku_counters (
        organization_id,
        prefix,
        last_value
      )
      VALUES ($1, $2, 1)
  
      ON CONFLICT (organization_id, prefix)
      DO UPDATE SET
        last_value = sku_counters.last_value + 1
  
      RETURNING last_value
    `;
  
    const result = await pool.query(query, [organizationId, prefix]);
  
    const nextNumber = result.rows[0].last_value;
  
    return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
  };
