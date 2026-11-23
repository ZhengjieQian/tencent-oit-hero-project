import Database from "better-sqlite3";
import { mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";

export function createDatabase(
  filename = process.env.DATABASE_FILE ?? "./data/hero.sqlite",
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
  const seed = db.transaction(() => {
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
  });
  seed();
}

export function resetDatabase(
  filename = process.env.DATABASE_FILE ?? "./data/hero.sqlite",
): void {
  if (filename !== ":memory:") {
    rmSync(filename, { force: true });
    rmSync(`${filename}-wal`, { force: true });
    rmSync(`${filename}-shm`, { force: true });
    mkdirSync(dirname(filename), { recursive: true });
  }
  const db = createDatabase(filename);
  seedDemoData(db);
  db.close();
}
