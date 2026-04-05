-- ============================================================
-- Secure Workspace Dashboard — Static Seed Data
-- seed.sql: Inserts organizations, roles, permissions, and
--           role→permission mappings.
--
-- NOTE: Users require bcrypt hashing and cannot be seeded
--       from plain SQL. Run the TypeScript seed script instead:
--           npm run seed
--       That script creates all 41 users, activity_logs, and
--       audit_logs with randomized timestamps over 90 days.
-- ============================================================

USE `workspace_db`;

-- ─────────────────────────────────────────────────────────────
-- Organization
-- ─────────────────────────────────────────────────────────────
INSERT INTO `organizations` (`id`, `name`) VALUES
  (1, 'Acme Corporation');

-- ─────────────────────────────────────────────────────────────
-- Roles
-- ─────────────────────────────────────────────────────────────
INSERT INTO `roles` (`id`, `role_name`, `description`) VALUES
  (1, 'admin',   'Full system access — manages users, roles, org config, and all audit trails'),
  (2, 'manager', 'Team lead with user management, analytics, and audit visibility'),
  (3, 'member',  'Standard workspace member with read access to user directory'),
  (4, 'viewer',  'Read-only observer — no write operations allowed');

-- ─────────────────────────────────────────────────────────────
-- Permissions
-- ─────────────────────────────────────────────────────────────
INSERT INTO `permissions` (`id`, `permission_name`) VALUES
  (1, 'view_users'),
  (2, 'create_users'),
  (3, 'edit_users'),
  (4, 'delete_users'),
  (5, 'assign_roles'),
  (6, 'view_audit_logs'),
  (7, 'view_analytics');

-- ─────────────────────────────────────────────────────────────
-- Role → Permission Mapping
-- ─────────────────────────────────────────────────────────────

-- admin: all permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
  (1, 1), -- view_users
  (1, 2), -- create_users
  (1, 3), -- edit_users
  (1, 4), -- delete_users
  (1, 5), -- assign_roles
  (1, 6), -- view_audit_logs
  (1, 7); -- view_analytics

-- manager: user ops + audit + analytics (no delete, no role assign)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
  (2, 1), -- view_users
  (2, 2), -- create_users
  (2, 3), -- edit_users
  (2, 6), -- view_audit_logs
  (2, 7); -- view_analytics

-- member: read users only
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
  (3, 1); -- view_users

-- viewer: no permissions (intentionally empty)
