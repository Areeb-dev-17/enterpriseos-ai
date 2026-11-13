import { pool } from "../config/database.js";

export const getInventoryAnalytics = async (
  organizationId: string
) => {
  const query = `
    WITH inventory AS (
      SELECT
        id,
        product_name AS "productName",
        category,
        available_stock AS "availableStock",
        reorder_level AS "reorderLevel",
        unit_price AS "unitPrice",
        CASE
          WHEN available_stock = 0 THEN 'Out of Stock'
          WHEN available_stock <= reorder_level THEN 'Low Stock'
          ELSE 'In Stock'
        END AS "stockStatus"
      FROM products
      WHERE organization_id = $1
    ),

    summary AS (
      SELECT
        COUNT(*)::int AS "totalProducts",
        COALESCE(SUM("availableStock"), 0)::int AS "totalUnits",
        COALESCE(
          SUM("availableStock" * "unitPrice"), 0
        ) AS "inventoryValue",
        COUNT(*) FILTER (
          WHERE "stockStatus" = 'Low Stock'
        )::int AS "lowStock",
        COUNT(*) FILTER (
          WHERE "stockStatus" = 'Out of Stock'
        )::int AS "outOfStock"
      FROM inventory
    ),

    category_distribution AS (
      SELECT
        category AS name,
        SUM("availableStock")::int AS value
      FROM inventory
      GROUP BY category
      ORDER BY category
    ),

    status_distribution AS (
      SELECT
        "stockStatus" AS name,
        COUNT(*)::int AS value
      FROM inventory
      GROUP BY "stockStatus"
    ),

    top_products AS (
      SELECT
        id,
        "productName",
        "availableStock",
        "unitPrice",
        ("availableStock" * "unitPrice") AS "inventoryValue"
      FROM inventory
      ORDER BY "inventoryValue" DESC, "productName" ASC
      LIMIT 5
    )

    SELECT
      (SELECT row_to_json(summary) FROM summary) AS summary,
      (
        SELECT COALESCE(json_agg(category_distribution), '[]'::json)
        FROM category_distribution
      ) AS "categoryData",
      (
        SELECT COALESCE(json_agg(status_distribution), '[]'::json)
        FROM status_distribution
      ) AS "statusData",
      (
        SELECT COALESCE(json_agg(top_products), '[]'::json)
        FROM top_products
      ) AS "topProducts";
  `;

  const result = await pool.query(query, [organizationId]);

  return result.rows[0];
};