import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_DATABASE_FILE = fileURLToPath(
  new URL("../../data/hero.sqlite", import.meta.url),
);

export function createDatabase(
  filename = DEFAULT_DATABASE_FILE,
): Database.Database {
  if (filename !== ":memory:") {
    mkdirSync(dirname(filename), { recursive: true });
  }
  const db = new Database(filename);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
      subscription_ends_at TEXT NOT NULL,
      region TEXT NOT NULL DEFAULT '',
      plan TEXT NOT NULL DEFAULT '',
      industry TEXT NOT NULL DEFAULT '',
      employee_count INTEGER NOT NULL DEFAULT 0,
      annual_recurring_revenue_cents INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('platform_admin', 'tenant_admin', 'member')),
      tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL DEFAULT '',
      job_title TEXT NOT NULL DEFAULT '',
      joined_at TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id TEXT NOT NULL REFERENCES users(id),
      tenant_id TEXT NOT NULL REFERENCES tenants(id),
      action TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  addColumnIfMissing(db, "tenants", "region TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "tenants", "plan TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "tenants", "industry TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "tenants", "employee_count INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(
    db,
    "tenants",
    "annual_recurring_revenue_cents INTEGER NOT NULL DEFAULT 0",
  );
  addColumnIfMissing(db, "users", "full_name TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "users", "job_title TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "users", "joined_at TEXT NOT NULL DEFAULT ''");
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tenants_region ON tenants(region);
    CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);
  `);
  return db;
}

export function seedDemoData(db: Database.Database): void {
  db.transaction(() => insertDemoData(db))();
}

export function resetDemoData(db: Database.Database): void {
  db.transaction(() => {
    db.exec(
      "DELETE FROM audit_events; DELETE FROM users; DELETE FROM tenants;",
    );
    insertDemoData(db);
  })();
}

export function resetDatabase(): void {
  const db = createDatabase();
  try {
    resetDemoData(db);
  } finally {
    db.close();
  }
}

function insertDemoData(db: Database.Database): void {
  const insertTenant = db.prepare(`
    INSERT OR IGNORE INTO tenants (
      id, name, status, subscription_ends_at, region, plan, industry,
      employee_count, annual_recurring_revenue_cents
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tenants = [
    ["acme", "Acme Studio", "active", "2027-01-15", "North America", "Growth", "Design", 42, 4_800_000],
    ["globex", "Globex Labs", "active", "2026-12-01", "Europe", "Enterprise", "Industrial", 1280, 128_000_000],
    ["initech", "Initech Systems", "active", "2027-06-30", "Asia Pacific", "Growth", "Technology", 185, 42_000_000],
    ["umbrella", "Umbrella Health", "suspended", "2027-03-31", "North America", "Starter", "Healthcare", 24, 2_400_000],
  ] as const;
  for (const tenant of tenants) insertTenant.run(...tenant);

  const insertUser = db.prepare(
    `INSERT OR IGNORE INTO users
      (id, email, role, tenant_id, full_name, job_title, joined_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const users = [
    ["platform-admin", "ops@northstar.example", "platform_admin", null, "Morgan Blake", "Platform operator", "2024-01-08"],
    ["acme-admin", "admin@acme.example", "tenant_admin", "acme", "Olivia Carter", "Workspace administrator", "2024-03-12"],
    ["acme-member", "member@acme.example", "member", "acme", "Leo Martin", "Product designer", "2024-06-03"],
    ["acme-mia", "mia.chen@acme.example", "member", "acme", "Mia Chen", "Product designer", "2025-02-17"],
    ["acme-noah", "noah.reed@acme.example", "member", "acme", "Noah Reed", "Customer researcher", "2025-09-22"],
    ["globex-admin", "admin@globex.example", "tenant_admin", "globex", "Aisha Patel", "IT administrator", "2023-11-14"],
    ["globex-chloe", "chloe.zhang@globex.example", "member", "globex", "Chloe Zhang", "Operations analyst", "2024-02-08"],
    ["globex-ethan", "ethan.ross@globex.example", "member", "globex", "Ethan Ross", "Plant manager", "2024-08-19"],
    ["globex-hana", "hana.kim@globex.example", "member", "globex", "Hana Kim", "Security specialist", "2025-01-06"],
    ["initech-admin", "admin@initech.example", "tenant_admin", "initech", "Rachel Lin", "Workspace administrator", "2024-04-21"],
    ["initech-amir", "amir.khan@initech.example", "member", "initech", "Amir Khan", "Software engineer", "2024-09-10"],
    ["initech-alina", "alina.park@initech.example", "member", "initech", "Alina Park", "Data analyst", "2025-03-05"],
    ["initech-jules", "jules.morgan@initech.example", "member", "initech", "Jules Morgan", "Product manager", "2025-11-11"],
    ["umbrella-admin", "admin@umbrella.example", "tenant_admin", "umbrella", "Maya Wilson", "IT administrator", "2024-02-01"],
    ["umbrella-lin", "lin.wei@umbrella.example", "member", "umbrella", "Lin Wei", "Clinical operations lead", "2024-05-14"],
    ["umbrella-drew", "drew.hall@umbrella.example", "member", "umbrella", "Drew Hall", "Compliance analyst", "2025-01-20"],
  ] as const;
  for (const user of users) insertUser.run(...user);

  const updateTenant = db.prepare(`
    UPDATE tenants SET region = ?, plan = ?, industry = ?, employee_count = ?,
      annual_recurring_revenue_cents = ?
    WHERE id = ? AND region = ''
  `);
  for (const [id, , , , region, plan, industry, employeeCount, arr] of tenants) {
    updateTenant.run(region, plan, industry, employeeCount, arr, id);
  }
  const updateUser = db.prepare(`
    UPDATE users SET full_name = ?, job_title = ?, joined_at = ?
    WHERE id = ? AND full_name = ''
  `);
  for (const [id, , , , fullName, jobTitle, joinedAt] of users) {
    updateUser.run(fullName, jobTitle, joinedAt, id);
  }
}

function addColumnIfMissing(
  db: Database.Database,
  table: "tenants" | "users",
  definition: string,
) {
  const columnName = definition.split(" ", 1)[0];
  const columns = db.pragma(`table_info(${table})`) as { name: string }[];
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}
