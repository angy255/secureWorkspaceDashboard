-- ============================================================
-- Secure Workspace Dashboard — Database Schema
-- Migration: 001_schema.sql
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS `workspace_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `workspace_db`;

-- ─────────────────────────────────────────────────────────────
-- organizations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `organizations` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- roles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `roles` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_name`   ENUM('admin','manager','member','viewer') NOT NULL,
  `description` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- permissions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `permissions` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `permission_name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `uq_permission_name` UNIQUE (`permission_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- role_permissions  (junction table)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id`       INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_rp_role`
    FOREIGN KEY (`role_id`)
    REFERENCES `roles`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_rp_permission`
    FOREIGN KEY (`permission_id`)
    REFERENCES `permissions`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(255) NOT NULL,
  `email`           VARCHAR(255) NOT NULL,
  `hashed_password` VARCHAR(255) NOT NULL,
  `role_id`         INT UNSIGNED NOT NULL,
  `organization_id` INT UNSIGNED NOT NULL,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `uq_user_email` UNIQUE (`email`),
  CONSTRAINT `fk_user_role`
    FOREIGN KEY (`role_id`)
    REFERENCES `roles`(`id`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_user_org`
    FOREIGN KEY (`organization_id`)
    REFERENCES `organizations`(`id`)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- audit_logs
-- Tracks admin / manager actions for compliance auditing.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `action`      VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50)  DEFAULT NULL,
  `entity_id`   INT UNSIGNED DEFAULT NULL,
  `timestamp`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_al_user_id`  (`user_id`),
  INDEX `idx_al_timestamp` (`timestamp`),
  INDEX `idx_al_action`   (`action`),
  CONSTRAINT `fk_al_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- activity_logs
-- Tracks user logins (time, IP, device).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `login_time`  TIMESTAMP    NOT NULL,
  `ip_address`  VARCHAR(45)  DEFAULT NULL,
  `device_info` TEXT         DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_acl_user_id`    (`user_id`),
  INDEX `idx_acl_login_time` (`login_time`),
  CONSTRAINT `fk_acl_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
