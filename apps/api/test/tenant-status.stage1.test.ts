import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type Database from "better-sqlite3";
import { createApp } from "../src/app.js";
import { createDatabase, seedDemoData } from "../src/db/database.js";

describe("stage 1: operator tenant status updates", () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = createDatabase(":memory:");
    seedDemoData(db);
    app = createApp(db);
  });
  afterEach(() => db.close());

  async function signedIn(actorId: string) {
    const client = request.agent(app);
    await client.post("/api/dev/session").send({ actorId }).expect(200);
    return client;
  }

  it("lets the platform admin persist a valid tenant status update", async () => {
    const operator = await signedIn("platform-admin");
    const response = await operator
      .patch("/api/operator/tenants/acme/status")
      .send({ status: "suspended" })
      .expect(200);
    expect(response.body.tenant).toMatchObject({
      id: "acme",
      status: "suspended",
    });
    expect(
      db.prepare("SELECT status FROM tenants WHERE id = ?").get("acme"),
    ).toEqual({ status: "suspended" });
  });

  it("rejects status changes by tenant users and unauthenticated callers", async () => {
    for (const actorId of ["acme-admin", "acme-member"]) {
      const user = await signedIn(actorId);
      await user
        .patch("/api/operator/tenants/acme/status")
        .send({ status: "suspended" })
        .expect(403);
    }
    await request(app)
      .patch("/api/operator/tenants/acme/status")
      .send({ status: "suspended" })
      .expect(401);
    expect(
      db.prepare("SELECT status FROM tenants WHERE id = ?").get("acme"),
    ).toEqual({ status: "active" });
  });

  it("rejects invalid states and unknown tenant IDs without a partial write", async () => {
    const operator = await signedIn("platform-admin");
    await operator
      .patch("/api/operator/tenants/acme/status")
      .send({ status: "deleted" })
      .expect(400);
    await operator
      .patch("/api/operator/tenants/missing/status")
      .send({ status: "suspended" })
      .expect(404);
    expect(
      db.prepare("SELECT status FROM tenants WHERE id = ?").get("acme"),
    ).toEqual({ status: "active" });
  });
});
