import { Pool, type PoolClient } from "pg";

export const DEFAULT_DATABASE_URL = "postgres://hero:hero@127.0.0.1:5432/hero";

export function createDatabase(connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL): Pool {
  return new Pool({ connectionString, max: 10 });
}

export async function initializeDatabase(db: Pool): Promise<void> {
  await db.query(`
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
      id BIGSERIAL PRIMARY KEY,
      actor_user_id TEXT NOT NULL REFERENCES users(id),
      tenant_id TEXT NOT NULL REFERENCES tenants(id),
      action TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export async function seedDemoData(db: Pool): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await insertDemoData(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function resetDemoData(db: Pool): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM audit_events");
    await client.query("DELETE FROM users");
    await client.query("DELETE FROM tenants");
    await insertDemoData(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function resetDatabase(): Promise<void> {
  const db = createDatabase();
  try {
    await initializeDatabase(db);
    await resetDemoData(db);
  } finally {
    await db.end();
  }
}

async function insertDemoData(db: PoolClient): Promise<void> {
  const tenants = [
    ["acme", "Acme Studio", "active", "2027-01-15"],
    ["globex", "Globex Labs", "active", "2026-12-01"],
  ] as const;
  for (const tenant of tenants) {
    await db.query(
      "INSERT INTO tenants (id,name,status,subscription_ends_at) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING",
      [...tenant],
    );
  }

  const users = [
    ["platform-admin", "ops@northstar.example", "platform_admin", null],
    ["acme-admin", "admin@acme.example", "tenant_admin", "acme"],
    ["globex-admin", "admin@globex.example", "tenant_admin", "globex"],
    ["acme-member", "member@acme.example", "member", "acme"],
  ] as const;
  for (const user of users) {
    await db.query(
      "INSERT INTO users (id,email,role,tenant_id) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING",
      [...user],
    );
  }
}
