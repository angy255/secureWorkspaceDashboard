import { query, queryOne, execute } from '../../db';
import type { User, UserWithPassword } from '../../types';

// SECURITY: All SQL uses parameterized placeholders — no string interpolation.

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  return queryOne<UserWithPassword>(
    `SELECT u.id, u.name, u.email, u.hashed_password, u.role_id,
            u.organization_id, u.created_at, r.role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.email = ?`,
    [email]
  );
}

export async function getUserById(id: number): Promise<User | null> {
  return queryOne<User>(
    `SELECT u.id, u.name, u.email, r.role_name, u.organization_id, u.created_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [id]
  );
}

export interface GetUsersParams {
  search?: string;
  role?: string;
  limit: number;
  offset: number;
}

export async function getAllUsers(params: GetUsersParams): Promise<User[]> {
  const { search, role, limit, offset } = params;

  let sql = `
    SELECT u.id, u.name, u.email, r.role_name, u.organization_id, u.created_at
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `;
  const values: unknown[] = [];

  if (search) {
    sql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
    values.push(`%${search}%`, `%${search}%`);
  }
  if (role) {
    sql += ' AND r.role_name = ?';
    values.push(role);
  }

  sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  values.push(limit, offset);

  return query<User>(sql, values);
}

export async function countUsers(params: Omit<GetUsersParams, 'limit' | 'offset'>): Promise<number> {
  const { search, role } = params;

  let sql = `
    SELECT COUNT(*) AS total
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `;
  const values: unknown[] = [];

  if (search) {
    sql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
    values.push(`%${search}%`, `%${search}%`);
  }
  if (role) {
    sql += ' AND r.role_name = ?';
    values.push(role);
  }

  const rows = await query<{ total: number }>(sql, values);
  return Number(rows[0]?.total ?? 0);
}

export interface CreateUserData {
  name: string;
  email: string;
  hashed_password: string;
  role_id: number;
  organization_id: number;
}

export async function createUser(data: CreateUserData): Promise<number> {
  const result = await execute(
    `INSERT INTO users (name, email, hashed_password, role_id, organization_id)
     VALUES (?, ?, ?, ?, ?)`,
    [data.name, data.email, data.hashed_password, data.role_id, data.organization_id]
  );
  return result.insertId;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role_id?: number;
}

export async function updateUser(id: number, data: UpdateUserData): Promise<void> {
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined)    { setClauses.push('name = ?');    values.push(data.name); }
  if (data.email !== undefined)   { setClauses.push('email = ?');   values.push(data.email); }
  if (data.role_id !== undefined) { setClauses.push('role_id = ?'); values.push(data.role_id); }

  if (setClauses.length === 0) return;

  values.push(id);
  await execute(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, values);
}

export async function deleteUser(id: number): Promise<void> {
  await execute('DELETE FROM users WHERE id = ?', [id]);
}

export async function userExists(id: number): Promise<boolean> {
  const row = await queryOne<{ id: number }>('SELECT id FROM users WHERE id = ?', [id]);
  return row !== null;
}
