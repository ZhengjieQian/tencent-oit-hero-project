import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool } from "pg";
import { createApp } from "../src/app.js";
import { createTestDatabase } from "./helpers/database.js";

describe("operator tenant status updates", () => {
  let db: Pool;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    ({ db } = await createTestDatabase());
    app = createApp(db);
  });
  afterEach(async () => db.end());

  async function signedIn(actorId: string) {
    const client = request.agent(app);
    await client.post("/api/dev/session").send({ actorId }).expect(200);
    return client;
  }

  async function getTenantStatuses() {
    const result = await db.query<{ id: string; status: string }>(
      "SELECT id, status FROM tenants ORDER BY id",
    );
    return Object.fromEntries(result.rows.map((row) => [row.id, row.status]));
  }

  it("allows platform_admin to suspend and reactivate a single tenant and persists to DB", async () => {
    const operator = await signedIn("platform-admin");

    const suspendRes = await operator
      .patch("/api/operator/tenants/acme/status")
      .send({ status: "suspended" })
      .expect(200);

    expect(suspendRes.body.tenant).toMatchObject({
      id: "acme",
      name: "Acme Studio",
      status: "suspended",
    });
    expect(await getTenantStatuses()).toEqual({
      acme: "suspended",
      globex: "active",
    });

    const listAfterSuspend = await operator
      .get("/api/operator/tenants")
      .expect(200);
    expect(
      listAfterSuspend.body.items.find((t: { id: string }) => t.id === "acme")
        ?.status,
    ).toBe("suspended");
    expect(
      listAfterSuspend.body.items.find((t: { id: string }) => t.id === "globex")
        ?.status,
    ).toBe("active");

    const reactivateRes = await operator
      .patch("/api/operator/tenants/acme/status")
      .send({ status: "active" })
      .expect(200);

    expect(reactivateRes.body.tenant).toMatchObject({
      id: "acme",
      name: "Acme Studio",
      status: "active",
    });
    expect(await getTenantStatuses()).toEqual({
      acme: "active",
      globex: "active",
    });
  });

  it("rejects unauthenticated and non-platform_admin callers without changing DB", async () => {
    await request(app)
      .patch("/api/operator/tenants/acme/status")
      .send({ status: "suspended" })
      .expect(401);

    const tenantAdmin = await signedIn("acme-admin");
    await tenantAdmin
      .patch("/api/operator/tenants/acme/status")
      .send({ status: "suspended" })
      .expect(403);

    const member = await signedIn("acme-member");
    await member
      .patch("/api/operator/tenants/acme/status")
      .send({ status: "suspended" })
      .expect(403);

    expect(await getTenantStatuses()).toEqual({
      acme: "active",
      globex: "active",
    });
  });

  it("rejects invalid statuses with 400 and unknown tenants with 404 without changing DB", async () => {
    const operator = await signedIn("platform-admin");

    await operator
      .patch("/api/operator/tenants/acme/status")
      .send({ status: "deleted" })
      .expect(400);

    await operator
      .patch("/api/operator/tenants/acme/status")
      .send({})
      .expect(400);

    await operator
      .patch("/api/operator/tenants/nonexistent/status")
      .send({ status: "suspended" })
      .expect(404);

    expect(await getTenantStatuses()).toEqual({
      acme: "active",
      globex: "active",
    });
  });
});
