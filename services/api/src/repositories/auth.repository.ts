import { pool } from "../config/database.js";

interface SignUpData {
  name: string;
  email: string;
  passwordHash: string;
  organizationName: string;
  organizationSlug: string;
}

export const createUserWithOrganization = async (data: SignUpData) => {
  const client = await pool.connect();
  try {
    //DATABASE TRANSACTION
    await client.query("BEGIN");
    // CReate ORganization
    const organizationResult = await client.query(
      "INSERT INTO organizations (name,slug) VAlUES ($1,$2) RETURNING id,name,slug",
      [data.organizationName, data.organizationSlug],
    );
    const organization = organizationResult.rows[0];

    //2 create user
    const userResult = await pool.query(
      "INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email",
      [data.name, data.email, data.passwordHash],
    );
    const user = userResult.rows[0];

    //3  Connect user with organization
    await client.query(
      `INSERT INTO memberships (organization_id, user_id, role)
             VALUES ($1, $2, $3)`,
      [organization.id, user.id, "admin"],
    );

    await client.query("COMMIT");
    return { user, organization };
  } catch (error) {
    console.error("Error creating user with organization:", error);
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};



export const findUserForLogin = async (
  email: string,
) => {
  const result = await pool.query(
    `SELECT
    u.id AS user_id,
    u.name,
    u.email,
    u.password_hash,
    o.id AS organization_id,
    o.name AS organization_name,
    o.slug AS organization_slug,
    m.role
  FROM users u
  INNER JOIN memberships m ON m.user_id = u.id
  INNER JOIN organizations o ON o.id = m.organization_id
  WHERE u.email = $1
  LIMIT 1`,
  [email]
  );
  return result.rows[0] ?? null;
};

interface CreateMemberData {
    name: string;
    email: string;
    passwordHash: string;
    organizationId: string;
    role: string;
  }
  
  export const createOrganizationMember = async (
    data: CreateMemberData
  ) => {
    const client = await pool.connect();
  
    try {
      await client.query("BEGIN");
  
      const userResult = await client.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
        [data.name, data.email, data.passwordHash]
      );
  
      const user = userResult.rows[0];
  
      const membershipResult = await client.query(
        `INSERT INTO memberships (organization_id, user_id, role)
         VALUES ($1, $2, $3)
         RETURNING organization_id, user_id, role`,
        [data.organizationId, user.id, data.role]
      );
  
      await client.query("COMMIT");
  
      return {
        user,
        membership: membershipResult.rows[0],
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };


  export const getOrganizationMembers = async (
    organizationId: string
  ) => {
    const result = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        m.role,
        m.created_at AS joined_at
      FROM users u
      INNER JOIN memberships m ON m.user_id = u.id
      WHERE m.organization_id = $1
      ORDER BY m.created_at DESC`,
      [organizationId]
    );
  
    return result.rows;
  };
  
  export const updateMemberRole = async (
    userId: string,
    organizationId: string,
    role: string
  ) => {
    const result = await pool.query(
      `UPDATE memberships
       SET role = $1
       WHERE user_id = $2
         AND organization_id = $3
       RETURNING user_id, organization_id, role`,
      [role, userId, organizationId]
    );
  
    return result.rows[0] ?? null;
  };