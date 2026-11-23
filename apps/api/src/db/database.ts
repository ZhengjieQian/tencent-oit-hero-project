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
      subscription_ends_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('platform_admin', 'tenant_admin', 'member')),
      tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE
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
  db.prepare(
    "INSERT OR IGNORE INTO tenants (id, name, status, subscription_ends_at) VALUES (?, ?, ?, ?)",
  ).run("acme", "Acme Studio", "active", "2027-01-15");
  db.prepare(
    "INSERT OR IGNORE INTO tenants (id, name, status, subscription_ends_at) VALUES (?, ?, ?, ?)",
  ).run("globex", "Globex Labs", "active", "2026-12-01");
  const insertUser = db.prepare(
    "INSERT OR IGNORE INTO users (id, email, role, tenant_id) VALUES (?, ?, ?, ?)",
  );
  insertUser.run(
    "platform-admin",
    "ops@northstar.example",
    "platform_admin",
    null,
  );
  insertUser.run("acme-admin", "admin@acme.example", "tenant_admin", "acme");
  insertUser.run(
    "globex-admin",
    "admin@globex.example",
    "tenant_admin",
    "globex",
  );
  insertUser.run("acme-member", "member@acme.example", "member", "acme");
}
