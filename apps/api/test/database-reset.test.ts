import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase, resetDatabase, seedDemoData } from "../src/db/database.js";

describe("demo database reset", () => {
  let tempDirectory: string;

  afterEach(() => {
    if (tempDirectory) rmSync(tempDirectory, { recursive: true, force: true });
    delete process.env.DATABASE_FILE;
  });

  it("seeds the same demo actors more than once without duplicate-row errors", () => {
    const db = createDatabase(":memory:");
    try {
      seedDemoData(db);
      expect(() => seedDemoData(db)).not.toThrow();
      expect(db.prepare("SELECT id FROM tenants").all()).toHaveLength(4);
      expect(db.prepare("SELECT id FROM users").all()).toHaveLength(16);
    } finally {
      db.close();
    }
  });

  it("adds directory columns to an existing interview database without losing status", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "hero-upgrade-"));
    const filename = join(tempDirectory, "legacy.sqlite");
    const legacy = new Database(filename);
    legacy.exec(`
      CREATE TABLE tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
        subscription_ends_at TEXT NOT NULL
      );
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK (role IN ('platform_admin', 'tenant_admin', 'member')),
        tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE
      );
      INSERT INTO tenants VALUES ('acme', 'Acme Studio', 'suspended', '2027-01-15');
      INSERT INTO users VALUES ('acme-admin', 'admin@acme.example', 'tenant_admin', 'acme');
    `);
    legacy.close();

    const upgraded = createDatabase(filename);
    try {
      seedDemoData(upgraded);
      expect(
        upgraded.prepare("SELECT status, region, plan FROM tenants WHERE id = 'acme'").get(),
      ).toEqual({ status: "suspended", region: "North America", plan: "Growth" });
      expect(
        upgraded.prepare("SELECT full_name FROM users WHERE id = 'acme-admin'").get(),
      ).toEqual({ full_name: "Olivia Carter" });
    } finally {
      upgraded.close();
    }
  });

  it("does not delete a file selected through DATABASE_FILE", () => {
    tempDirectory = mkdtempSync(join(tmpdir(), "hero-reset-"));
    const unrelatedPath = join(tempDirectory, "keep.txt");
    writeFileSync(unrelatedPath, "keep this file");
    process.env.DATABASE_FILE = unrelatedPath;

    resetDatabase();

    expect(readFileSync(unrelatedPath, "utf8")).toBe("keep this file");
  });

  it("resets the seeded database in place so an already-running API sees the new rows", () => {
    resetDatabase();
    const apiConnection = createDatabase();
    try {
      apiConnection
        .prepare("UPDATE tenants SET status = 'suspended' WHERE id = 'acme'")
        .run();

      resetDatabase();

      expect(
        apiConnection
          .prepare("SELECT status FROM tenants WHERE id = 'acme'")
          .get(),
      ).toEqual({ status: "active" });
    } finally {
      apiConnection.close();
    }
  });
});
