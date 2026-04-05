import { query } from '../../db';

// ─────────────────────────────────────────────────────────────
// Analytics Queries
// All queries are read-only SELECT statements.
// ─────────────────────────────────────────────────────────────

/**
 * userGrowthByMonth
 * Groups user registrations by calendar month.
 * Returns chronological list of { label, count } pairs.
 *
 * DATE_FORMAT(created_at, '%Y-%m') collapses timestamps into
 * year-month strings like "2024-01", enabling month-level grouping
 * without truncating to the first day of the month.
 */
export async function userGrowthByMonth(): Promise<{ label: string; count: number }[]> {
  return query<{ label: string; count: number }>(`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') AS label,
      COUNT(*)                          AS count
    FROM users
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY label ASC
  `);
}

/**
 * roleDistribution
 * Counts how many users are assigned to each role.
 * LEFT JOIN ensures roles with 0 members still appear in results,
 * giving a complete picture of the role landscape.
 */
export async function roleDistribution(): Promise<{ role: string; count: number }[]> {
  return query<{ role: string; count: number }>(`
    SELECT
      r.role_name  AS role,
      COUNT(u.id)  AS count
    FROM roles r
    LEFT JOIN users u ON u.role_id = r.id
    GROUP BY r.id, r.role_name
    ORDER BY count DESC
  `);
}

/**
 * loginActivityLast30Days
 * Returns daily login counts for the trailing 30-day window.
 *
 * DATE_FORMAT returns a plain VARCHAR string ('YYYY-MM-DD') rather than
 * a MySQL DATE type, preventing the mysql2 driver from serialising the
 * value as a JavaScript Date object (which would appear as a full ISO
 * timestamp in JSON).  The string format still sorts lexicographically
 * so ORDER BY date ASC remains correct.
 *
 * DATE_SUB(CURDATE(), …) computes the lower bound relative to the DB
 * server's clock, keeping the query timezone-aware without hard-coding dates.
 */
export async function loginActivityLast30Days(): Promise<{ date: string; count: number }[]> {
  return query<{ date: string; count: number }>(`
    SELECT
      DATE_FORMAT(login_time, '%Y-%m-%d') AS date,
      COUNT(*)                             AS count
    FROM activity_logs
    WHERE login_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE_FORMAT(login_time, '%Y-%m-%d')
    ORDER BY date ASC
  `);
}

/**
 * auditFrequency
 * Ranks audit actions by frequency, most common first.
 * Useful for detecting unusual admin behaviour patterns.
 */
export async function auditFrequency(): Promise<{ action: string; count: number }[]> {
  return query<{ action: string; count: number }>(`
    SELECT
      action,
      COUNT(*) AS count
    FROM audit_logs
    GROUP BY action
    ORDER BY count DESC
  `);
}

/**
 * topActiveUsers
 * Returns the 10 most active users ranked by audit event count.
 *
 * Implementation uses two CTEs and a ROW_NUMBER() window function:
 *
 *   1. UserActionCounts CTE — aggregates audit_logs per user with a
 *      LEFT JOIN so users with 0 actions are still included.
 *
 *   2. RankedUsers CTE — applies ROW_NUMBER() OVER (ORDER BY
 *      action_count DESC) which assigns a unique sequential rank
 *      starting at 1 for the most active user.  Unlike RANK(),
 *      ROW_NUMBER() never produces ties or gaps.
 *
 *   3. Final SELECT — filters to the top 10 rows and returns the
 *      rank alongside user identity and activity count.
 */
export async function topActiveUsers(): Promise<
  { rank: number; user_name: string; user_email: string; action_count: number }[]
> {
  return query(`
    WITH UserActionCounts AS (
      -- Step 1: aggregate total audit events per user
      SELECT
        u.id,
        u.name  AS user_name,
        u.email AS user_email,
        COUNT(al.id) AS action_count
      FROM users u
      LEFT JOIN audit_logs al ON al.user_id = u.id
      GROUP BY u.id, u.name, u.email
    ),
    RankedUsers AS (
      -- Step 2: rank every user by their action count (descending)
      -- ROW_NUMBER() guarantees a unique rank even when counts tie
      SELECT
        user_name,
        user_email,
        action_count,
        ROW_NUMBER() OVER (ORDER BY action_count DESC) AS \`rank\`
      FROM UserActionCounts
    )
    -- Step 3: emit only the top 10
    SELECT \`rank\`, user_name, user_email, action_count
    FROM RankedUsers
    WHERE \`rank\` <= 10
    ORDER BY \`rank\` ASC
  `);
}
