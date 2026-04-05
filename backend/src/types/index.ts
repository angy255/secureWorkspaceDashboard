// ─────────────────────────────────────────────────────────────
// Shared TypeScript types for the Secure Workspace Dashboard
// ─────────────────────────────────────────────────────────────

export interface Organization {
  id: number;
  name: string;
  created_at: string;
}

export interface Role {
  id: number;
  role_name: 'admin' | 'manager' | 'member' | 'viewer';
  description: string | null;
}

export interface Permission {
  id: number;
  permission_name: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

/** User row as returned by DB queries (hashed_password excluded from API responses) */
export interface User {
  id: number;
  name: string;
  email: string;
  role_name: string;
  organization_id: number;
  created_at: string;
}

/** Extended user including hashed_password — only used internally for auth */
export interface UserWithPassword extends User {
  hashed_password: string;
  role_id: number;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  timestamp: string;
  user_name?: string;
  user_email?: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  login_time: string;
  ip_address: string | null;
  device_info: string | null;
}

/** Attached to req.user by authMiddleware after JWT verification */
export interface JwtPayload {
  userId: number;
  role: string;
  organizationId: number;
}

// Extend Express Request to carry the decoded JWT payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
