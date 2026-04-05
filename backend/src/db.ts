import 'dotenv/config';
import mysql from 'mysql2/promise';

/* SECURITY: All DB credentials loaded from environment variables — never hardcoded */
const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  port:             Number(process.env.DB_PORT) || 3306,
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',
  database:         process.env.DB_NAME     || 'workspace_db',
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  timezone:         '+00:00',
  charset:          'utf8mb4',
  ssl: process.env.NODE_ENV === 'production' ? { minVersion: 'TLSv1.2' } : undefined,
});

/**
 * Execute a SELECT query and return an array of typed rows.
 *
 * SECURITY: Always pass values via `params` — never interpolate
 * user-supplied data into `sql`. mysql2 uses parameterized
 * prepared statements which prevent SQL injection.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const [rows] = await pool.query(sql, params ?? []);
  return rows as T[];
}

/**
 * Execute a SELECT and return the first row, or null if empty.
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Execute an INSERT / UPDATE / DELETE statement.
 * Returns the ResultSetHeader which contains insertId and affectedRows.
 */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.query(sql, params ?? []);
  return result as mysql.ResultSetHeader;
}

export { pool };
