import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';

interface RefreshTokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export const authRepository = {
  async storeRefreshToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await query<ResultSetHeader>(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:userId, :tokenHash, :expiresAt)',
      { userId, tokenHash, expiresAt }
    );
  },

  async findValidToken(tokenHash: string): Promise<RefreshTokenRow | null> {
    const rows = await query<RefreshTokenRow[]>(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = :tokenHash AND revoked_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      { tokenHash }
    );
    return rows[0] ?? null;
  },

  async revokeToken(tokenHash: string): Promise<void> {
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = :tokenHash', {
      tokenHash,
    });
  },

  async revokeAllForUser(userId: number): Promise<void> {
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = :userId AND revoked_at IS NULL',
      { userId }
    );
  },
};
