import cron from "node-cron";
import { pool } from "../config/database.js";
import { createDailyInventorySnapshot } from "../repositories/inventory-snapshot.repository.js";


const captureInitialSnapshots = async () => {
    console.log("[Inventory Snapshot] Initial capture started");
  
    try {
        const result = await pool.query(`
            SELECT DISTINCT organization_id AS id
            FROM products
          `);
  
      for (const organization of result.rows) {
        try {
          await createDailyInventorySnapshot(organization.id);
          console.log(
            `[Inventory Snapshot] Initial snapshot saved for ${organization.id}`
          );
        } catch (error) {
          console.error(
            `[Inventory Snapshot] Initial snapshot failed for ${organization.id}`,
            error
          );
        }
      }
    } catch (error) {
      console.error("[Inventory Snapshot] Initial capture failed", error);
    }
  };

export const startInventorySnapshotJob = () => {
    void captureInitialSnapshots();
  cron.schedule(
    "5 0 * * *",
    async () => {
      console.log("[Inventory Snapshot] Daily snapshot job started");

      try {
        const result = await pool.query(
          "SELECT id FROM organizations"
        );

        for (const organization of result.rows) {
          try {
            await createDailyInventorySnapshot(organization.id);
            console.log(
              `[Inventory Snapshot] Saved for organization ${organization.id}`
            );
          } catch (error) {
            console.error(
              `[Inventory Snapshot] Failed for organization ${organization.id}`,
              error
            );
          }
        }

        console.log("[Inventory Snapshot] Daily snapshot job completed");
      } catch (error) {
        console.error("[Inventory Snapshot] Job failed", error);
      }
    },
    {
      timezone: "UTC",
    }
  );

  console.log("[Inventory Snapshot] Scheduler registered for 00:05 UTC");
};