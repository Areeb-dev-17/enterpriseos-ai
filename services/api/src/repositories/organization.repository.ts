import { pool } from "../config/database.js";

export const getOrganizationById = async (organizationId: string) => {
    const result = await pool.query(
      `SELECT id, name, slug, created_at, updated_at
       FROM organizations
       WHERE id = $1`,
      [organizationId]
    );
  
    return result.rows[0] ?? null;
  };