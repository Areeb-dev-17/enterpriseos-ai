import { pool } from "../config/database.js";

export const getStockoutRiskProducts = async (organizationId: string) => {
  const query = `
    SELECT
      id,
      product_name AS "productName",
      sku,
      category,
      available_stock AS "availableStock",
      reorder_level AS "reorderLevel",
      unit_price AS "unitPrice",
      CASE
        WHEN available_stock = 0 THEN 'Critical'
        WHEN available_stock <= reorder_level THEN 'High'
        WHEN available_stock <= reorder_level * 1.5 THEN 'Medium'
      END AS "riskLevel"
    FROM products
    WHERE organization_id = $1
      AND (
        available_stock = 0
        OR available_stock <= reorder_level * 1.5
      )
    ORDER BY
      CASE
        WHEN available_stock = 0 THEN 1
        WHEN available_stock <= reorder_level THEN 2
        ELSE 3
      END,
      available_stock ASC
  `;

  const result = await pool.query(query, [organizationId]);

  return result.rows;
};