import { query, execute } from '../../db';
import type { AuditLog } from '../../types';

export interface GetAuditLogsParams {
  action?: string;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
}

export async function getAuditLogs(
  params: GetAuditLogsParams
): Promise<(AuditLog & { user_name: string; user_email: string })[]> {
  const { action, from, to, limit, offset } = params;

  // SECURITY: Only parameterized placeholders used — no user-supplied string interpolation
  let sql = `
    SELECT
      al.id,
      al.user_id,
      al.action,
      al.entity_type,
      al.entity_id,
      al.timestamp,
      u.name  AS user_name,
      u.email AS user_email
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const values: unknown[] = [];

  if (action) {
    sql += ' AND al.action = ?';
    values.push(action);
  }
  if (from) {
    sql += ' AND al.timestamp >= ?';
    values.push(from);
  }
  if (to) {
    sql += ' AND al.timestamp <= ?';
    values.push(to);
  }

  sql += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
  values.push(limit, offset);

  return query<AuditLog & { user_name: string; user_email: string }>(sql, values);
}

export async function countAuditLogs(
  params: Omit<GetAuditLogsParams, 'limit' | 'offset'>
): Promise<number> {
  const { action, from, to } = params;

  let sql = 'SELECT COUNT(*) AS total FROM audit_logs al WHERE 1=1';
  const values: unknown[] = [];

  if (action) {
    sql += ' AND al.action = ?';
    values.push(action);
  }
  if (from) {
    sql += ' AND al.timestamp >= ?';
    values.push(from);
  }
  if (to) {
    sql += ' AND al.timestamp <= ?';
    values.push(to);
  }

  const rows = await query<{ total: number }>(sql, values);
  return Number(rows[0]?.total ?? 0);
}

export interface CreateAuditLogData {
  user_id: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
}

export async function createAuditLog(data: CreateAuditLogData): Promise<void> {
  await execute(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
     VALUES (?, ?, ?, ?)`,
    [data.user_id, data.action, data.entity_type ?? null, data.entity_id ?? null]
  );
}

/** Returns distinct action names for use in filter dropdowns. */
export async function getDistinctActions(): Promise<string[]> {
  const rows = await query<{ action: string }>(
    'SELECT DISTINCT action FROM audit_logs ORDER BY action ASC'
  );
  return rows.map(r => r.action);
}
