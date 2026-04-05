import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../../db';

// SECURITY: bcrypt with 12 rounds for all seeded passwords
const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'password123';

interface SeedUser {
  name: string;
  email: string;
  role_id: 1 | 2 | 3 | 4;
  daysAgo: number;
}

const SEED_USERS: SeedUser[] = [
  // 1 admin
  { name: 'Alex Admin',         email: 'admin@example.com',           role_id: 1, daysAgo: 85 },
  // 5 managers
  { name: 'Morgan Matthews',    email: 'morgan.matthews@example.com',  role_id: 2, daysAgo: 80 },
  { name: 'Taylor Chen',        email: 'taylor.chen@example.com',      role_id: 2, daysAgo: 75 },
  { name: 'Jordan Rivera',      email: 'jordan.rivera@example.com',    role_id: 2, daysAgo: 70 },
  { name: 'Riley Thompson',     email: 'riley.thompson@example.com',   role_id: 2, daysAgo: 68 },
  { name: 'Casey Nguyen',       email: 'casey.nguyen@example.com',     role_id: 2, daysAgo: 65 },
  // 15 members
  { name: 'Sam Foster',         email: 'sam.foster@example.com',       role_id: 3, daysAgo: 60 },
  { name: 'Avery Brown',        email: 'avery.brown@example.com',      role_id: 3, daysAgo: 58 },
  { name: 'Dana White',         email: 'dana.white@example.com',       role_id: 3, daysAgo: 55 },
  { name: 'Jordan Green',       email: 'jordan.green@example.com',     role_id: 3, daysAgo: 53 },
  { name: 'Leslie Kim',         email: 'leslie.kim@example.com',       role_id: 3, daysAgo: 50 },
  { name: 'Quinn Silver',       email: 'quinn.silver@example.com',     role_id: 3, daysAgo: 48 },
  { name: 'Blake Stone',        email: 'blake.stone@example.com',      role_id: 3, daysAgo: 45 },
  { name: 'Charlie Reed',       email: 'charlie.reed@example.com',     role_id: 3, daysAgo: 42 },
  { name: 'Drew Kim',           email: 'drew.kim@example.com',         role_id: 3, daysAgo: 40 },
  { name: 'Ellis Cruz',         email: 'ellis.cruz@example.com',       role_id: 3, daysAgo: 37 },
  { name: 'Finley Moore',       email: 'finley.moore@example.com',     role_id: 3, daysAgo: 35 },
  { name: 'Glen Walsh',         email: 'glen.walsh@example.com',       role_id: 3, daysAgo: 30 },
  { name: 'Harper Ross',        email: 'harper.ross@example.com',      role_id: 3, daysAgo: 28 },
  { name: 'Indira Patel',       email: 'indira.patel@example.com',     role_id: 3, daysAgo: 25 },
  { name: 'Jamie Okafor',       email: 'jamie.okafor@example.com',     role_id: 3, daysAgo: 22 },
  // 20 viewers
  { name: 'Viewer Addison',     email: 'viewer.addison@example.com',   role_id: 4, daysAgo: 89 },
  { name: 'Viewer Bellamy',     email: 'viewer.bellamy@example.com',   role_id: 4, daysAgo: 87 },
  { name: 'Viewer Cameron',     email: 'viewer.cameron@example.com',   role_id: 4, daysAgo: 84 },
  { name: 'Viewer Dallas',      email: 'viewer.dallas@example.com',    role_id: 4, daysAgo: 82 },
  { name: 'Viewer Emery',       email: 'viewer.emery@example.com',     role_id: 4, daysAgo: 79 },
  { name: 'Viewer Fallon',      email: 'viewer.fallon@example.com',    role_id: 4, daysAgo: 76 },
  { name: 'Viewer Grey',        email: 'viewer.grey@example.com',      role_id: 4, daysAgo: 73 },
  { name: 'Viewer Haven',       email: 'viewer.haven@example.com',     role_id: 4, daysAgo: 71 },
  { name: 'Viewer Iris',        email: 'viewer.iris@example.com',      role_id: 4, daysAgo: 66 },
  { name: 'Viewer Jules',       email: 'viewer.jules@example.com',     role_id: 4, daysAgo: 63 },
  { name: 'Viewer Kendall',     email: 'viewer.kendall@example.com',   role_id: 4, daysAgo: 61 },
  { name: 'Viewer Lennox',      email: 'viewer.lennox@example.com',    role_id: 4, daysAgo: 57 },
  { name: 'Viewer Morgan',      email: 'viewer.morgan@example.com',    role_id: 4, daysAgo: 54 },
  { name: 'Viewer Nova',        email: 'viewer.nova@example.com',      role_id: 4, daysAgo: 51 },
  { name: 'Viewer Oakley',      email: 'viewer.oakley@example.com',    role_id: 4, daysAgo: 47 },
  { name: 'Viewer Phoenix',     email: 'viewer.phoenix@example.com',   role_id: 4, daysAgo: 44 },
  { name: 'Viewer Quinn',       email: 'viewer.quinn@example.com',     role_id: 4, daysAgo: 38 },
  { name: 'Viewer River',       email: 'viewer.river@example.com',     role_id: 4, daysAgo: 33 },
  { name: 'Viewer Sage',        email: 'viewer.sage@example.com',      role_id: 4, daysAgo: 18 },
  { name: 'Viewer Tatum',       email: 'viewer.tatum@example.com',     role_id: 4, daysAgo: 7  },
];

const AUDIT_ACTIONS = [
  'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
  'ASSIGN_ROLE', 'VIEW_REPORT', 'EXPORT_DATA',
  'RESET_PASSWORD', 'REVOKE_SESSION',
];
const ENTITY_TYPES = ['user', 'role', 'report', 'session'];

const DEVICE_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];
const IP_POOL = [
  '192.168.1.10', '192.168.1.25', '10.0.0.42', '10.0.0.55',
  '172.16.0.100', '203.0.113.42', '198.51.100.7', '198.51.100.18',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function toMySQLDatetime(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function daysAgoDate(days: number, jitterHours = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59), 0);
  // small random jitter
  d.setHours(d.getHours() + randomInt(-jitterHours, jitterHours));
  return toMySQLDatetime(d);
}

async function seed(): Promise<void> {
  console.log('Starting seed...');

  // Hash once — same hash reused per-batch for speed.
  // Each user gets the same password ("password123") in dev seeding.
  console.log('  Hashing password (rounds=12)...');
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // ── Users ──────────────────────────────────────────────────
  console.log(`  Inserting ${SEED_USERS.length} users...`);
  const insertedIds: number[] = [];

  for (const u of SEED_USERS) {
    const createdAt = daysAgoDate(u.daysAgo);
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, hashed_password, role_id, organization_id, created_at)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [u.name, u.email, hashedPassword, u.role_id, createdAt]
    ) as any[];
    insertedIds.push(result.insertId as number);
  }
  console.log(`  ${insertedIds.length} users inserted.`);

  // ── Activity Logs ──────────────────────────────────────────
  console.log('  Inserting activity_logs...');
  let activityCount = 0;
  for (const userId of insertedIds) {
    const loginCount = randomInt(4, 12);
    for (let i = 0; i < loginCount; i++) {
      const loginTime = daysAgoDate(randomInt(0, 90));
      await pool.execute(
        `INSERT INTO activity_logs (user_id, login_time, ip_address, device_info)
         VALUES (?, ?, ?, ?)`,
        [userId, loginTime, randomPick(IP_POOL), randomPick(DEVICE_AGENTS)]
      );
      activityCount++;
    }
  }
  console.log(`  ${activityCount} activity_log rows inserted.`);

  // ── Audit Logs ─────────────────────────────────────────────
  // Only admins (role_id=1) and managers (role_id=2) generate audit events.
  const privilegedUsers = SEED_USERS
    .map((u, i) => ({ ...u, id: insertedIds[i] }))
    .filter(u => u.role_id === 1 || u.role_id === 2);

  console.log('  Inserting audit_logs...');
  let auditCount = 0;
  for (const u of privilegedUsers) {
    const actionCount = u.role_id === 1 ? randomInt(20, 40) : randomInt(8, 18);
    for (let i = 0; i < actionCount; i++) {
      const action     = randomPick(AUDIT_ACTIONS);
      const entityType = randomPick(ENTITY_TYPES);
      const entityId   = randomPick(insertedIds);
      const timestamp  = daysAgoDate(randomInt(0, 90));
      await pool.execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, timestamp)
         VALUES (?, ?, ?, ?, ?)`,
        [u.id, action, entityType, entityId, timestamp]
      );
      auditCount++;
    }
  }
  console.log(`  ${auditCount} audit_log rows inserted.`);

  console.log('\nSeed complete!');
  console.log('   Login: admin@example.com / password123');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
