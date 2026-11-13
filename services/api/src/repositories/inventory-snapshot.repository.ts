import { pool } from "../config/database.js";

export const createDailyInventorySnapshot = async (
  organizationId: string
) => {
  const query = `
    INSERT INTO inventory_snapshots (
      organization_id,
      snapshot_date,
      total_products,
      total_units,
      inventory_value
    )
    SELECT
      $1,
      CURRENT_DATE,
      COUNT(*)::int,
      COALESCE(SUM(available_stock), 0)::int,
      COALESCE(SUM(available_stock * unit_price), 0)::numeric(14,2)
    FROM products
    WHERE organization_id = $1
    ON CONFLICT (organization_id, snapshot_date)
    DO UPDATE SET
      total_products = EXCLUDED.total_products,
      total_units = EXCLUDED.total_units,
      inventory_value = EXCLUDED.inventory_value
    RETURNING
      id,
      organization_id AS "organizationId",
      snapshot_date AS "snapshotDate",
      total_products AS "totalProducts",
      total_units AS "totalUnits",
      inventory_value AS "inventoryValue";
  `;

  const result = await pool.query(query, [organizationId]);

  return result.rows[0];
};