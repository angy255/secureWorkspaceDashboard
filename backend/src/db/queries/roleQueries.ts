import { query, queryOne, execute } from '../../db';
import type { Role, Permission, RoleWithPermissions } from '../../types';

export async function getAllRoles(): Promise<Role[]> {
  return query<Role>('SELECT id, role_name, description FROM roles ORDER BY id ASC');
}

export async function getAllPermissions(): Promise<Permission[]> {
  return query<Permission>('SELECT id, permission_name FROM permissions ORDER BY id ASC');
}

export async function getRoleById(id: number): Promise<Role | null> {
  return queryOne<Role>('SELECT id, role_name, description FROM roles WHERE id = ?', [id]);
}

export async function getRoleWithPermissions(roleId: number): Promise<RoleWithPermissions | null> {
  const role = await queryOne<Role>(
    'SELECT id, role_name, description FROM roles WHERE id = ?',
    [roleId]
  );
  if (!role) return null;

  const permissions = await query<Permission>(
    `SELECT p.id, p.permission_name
     FROM permissions p
     JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE rp.role_id = ?
     ORDER BY p.id ASC`,
    [roleId]
  );

  return { ...role, permissions };
}

/** Returns all roles with their full permissions lists in one query. */
export async function getAllRolesWithPermissions(): Promise<RoleWithPermissions[]> {
  // Fetch roles and permissions separately, then merge in memory.
  // This avoids the complexity of JSON_ARRAYAGG NULL-handling across MySQL versions.
  const roles    = await getAllRoles();
  const allPerms = await query<{ role_id: number; id: number; permission_name: string }>(
    `SELECT rp.role_id, p.id, p.permission_name
     FROM role_permissions rp
     JOIN permissions p ON rp.permission_id = p.id
     ORDER BY rp.role_id ASC, p.id ASC`
  );

  const permMap = new Map<number, Permission[]>();
  for (const row of allPerms) {
    if (!permMap.has(row.role_id)) permMap.set(row.role_id, []);
    permMap.get(row.role_id)!.push({ id: row.id, permission_name: row.permission_name });
  }

  return roles.map(r => ({
    ...r,
    permissions: permMap.get(r.id) ?? [],
  }));
}

export async function createRole(
  role_name: 'admin' | 'manager' | 'member' | 'viewer',
  description?: string
): Promise<number> {
  const result = await execute(
    'INSERT INTO roles (role_name, description) VALUES (?, ?)',
    [role_name, description ?? null]
  );
  return result.insertId;
}

export async function updateRoleDescription(id: number, description: string): Promise<void> {
  await execute('UPDATE roles SET description = ? WHERE id = ?', [description, id]);
}

/** Replace all permissions for a role atomically. */
export async function setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
  await execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
  for (const permId of permissionIds) {
    await execute(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
      [roleId, permId]
    );
  }
}
