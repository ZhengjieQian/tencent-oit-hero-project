import { describe, expect, it } from "vitest";
import { initializeDatabase, resetDemoData, seedDemoData } from "../src/db/database.js";
import { createTestDatabase } from "./helpers/database.js";

describe("PostgreSQL demo database", () => {
  it("seeds the same demo data repeatedly without duplicate rows", async () => {
    const { db } = await createTestDatabase();
    try {
      await seedDemoData(db);
      expect((await db.query("SELECT id FROM tenants")).rows).toHaveLength(2);
      expect((await db.query("SELECT id FROM users")).rows).toHaveLength(4);
    } finally {
      await db.end();
    }
  });

  it("re-runs schema initialization without overwriting tenant status", async () => {
    const { db } = await createTestDatabase();
    try {
      await db.query("UPDATE tenants SET status='suspended' WHERE id='acme'");
      await initializeDatabase(db);
      await seedDemoData(db);
      expect((await db.query("SELECT status FROM tenants WHERE id='acme'")).rows[0]).toEqual({ status: "suspended" });
    } finally {
      await db.end();
    }
  });

  it("resets seeded data in place so existing API connections see the reset", async () => {
    const { db } = await createTestDatabase();
    try {
      await db.query("UPDATE tenants SET status='suspended' WHERE id='acme'");
      await resetDemoData(db);
      expect((await db.query("SELECT status FROM tenants WHERE id='acme'")).rows[0]).toEqual({ status: "active" });
      expect((await db.query("SELECT id FROM tenants")).rows).toHaveLength(2);
    } finally {
      await db.end();
    }
  });
});
