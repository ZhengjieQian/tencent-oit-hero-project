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
      expect(db.prepare("SELECT id FROM tenants").all()).toHaveLength(2);
      expect(db.prepare("SELECT id FROM users").all()).toHaveLength(4);
    } finally {
      db.close();
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
