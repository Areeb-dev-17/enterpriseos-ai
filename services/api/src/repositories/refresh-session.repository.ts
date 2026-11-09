
import { pool } from "../config/database.js";

export interface CreateRefreshSessionInput {
  userId: string;
  organizationId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const createRefreshSession = async (
  data: CreateRefreshSessionInput
) => {
  const query = `
    INSERT INTO refresh_sessions (
      user_id,
      organization_id,
      token_hash,
      expires_at
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      user_id AS "userId",
      organization_id AS "organizationId",
      expires_at AS "expiresAt",
      created_at AS "createdAt"
  `;

  const values = [
    data.userId,
    data.organizationId,
    data.tokenHash,
    data.expiresAt,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const rotateRefreshSession = async (
  oldTokenHash: string,
  newTokenHash: string,
  newExpiresAt: Date
) => {
  const query = `
    UPDATE refresh_sessions
    SET
      token_hash = $2,
      expires_at = $3
    WHERE token_hash = $1
      AND revoked_at IS NULL
      AND expires_at > CURRENT_TIMESTAMP
    RETURNING
      id,
      user_id AS "userId",
      organization_id AS "organizationId",
      expires_at AS "expiresAt"
  `;

  const result = await pool.query(query, [
    oldTokenHash,
    newTokenHash,
    newExpiresAt,
  ]);

  return result.rows[0] ?? null;
};

export const revokeRefreshSession = async (tokenHash: string) => {
  const query = `
    UPDATE refresh_sessions
    SET revoked_at = CURRENT_TIMESTAMP
    WHERE token_hash = $1
      AND revoked_at IS NULL
    RETURNING id
  `;

  const result = await pool.query(query, [tokenHash]);
  return result.rows[0] ?? null;
};


export const getUserRoleForOrganization = async (
    userId: string,
    organizationId: string
  ): Promise<string | null> => {
    const query = `
      SELECT role
      FROM memberships
      WHERE user_id = $1
        AND organization_id = $2
      LIMIT 1
    `;
  
    const result = await pool.query(query, [
      userId,
      organizationId,
    ]);
  
    return result.rows[0]?.role ?? null;
  };
  