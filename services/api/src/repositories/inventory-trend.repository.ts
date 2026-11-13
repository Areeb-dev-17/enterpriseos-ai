import { pool } from "../config/database.js";

export const getInventoryTrend = async (
  organizationId: string,
  months = 6
) => {
  const query = `
    WITH monthly_snapshots AS (
      SELECT DISTINCT ON (
        DATE_TRUNC('month', snapshot_date)
      )
        snapshot_date,
        inventory_value
      FROM inventory_snapshots
      WHERE organization_id = $1
        AND snapshot_date >=
          DATE_TRUNC('month', CURRENT_DATE) - (($2::int - 1) * INTERVAL '1 month')
        AND snapshot_date <= CURRENT_DATE
      ORDER BY
        DATE_TRUNC('month', snapshot_date),
        snapshot_date DESC
    )
    SELECT
      TO_CHAR(snapshot_date, 'Mon YYYY') AS month,
      snapshot_date AS "snapshotDate",
      inventory_value AS "inventoryValue"
    FROM monthly_snapshots
    ORDER BY snapshot_date ASC;
  `;

  const result = await pool.query(query, [organizationId, months]);

  return result.rows;
};