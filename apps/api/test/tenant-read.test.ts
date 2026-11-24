import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Pool } from "pg";
import { createApp } from "../src/app.js";
import { createTestDatabase } from "./helpers/database.js";

describe("starter tenant read paths", () => {
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

  it("lets only the platform operator search the platform tenant directory", async () => {
    const operator = await signedIn("platform-admin");
    const list = await operator.get("/api/operator/tenants?q=ACM").expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0]).toMatchObject({
      id: "acme",
      name: "Acme Studio",
      status: "active",
    });
    await (await signedIn("acme-admin"))
      .get("/api/operator/tenants")
      .expect(403);
    await request(app).get("/api/operator/tenants").expect(401);
  });

  it("derives tenant profile and member scope from the active session", async () => {
    const acme = await signedIn("acme-admin");
    const current = await acme.get("/api/tenant/current").expect(200);
    expect(current.body.tenant.id).toBe("acme");
    expect(current.body.tenant).toMatchObject({
      id: "acme",
      name: "Acme Studio",
      status: "active",
    });
    expect(current.body.tenant).not.toHaveProperty("subscriptionEndsAt");
    const members = await acme
      .get("/api/tenant/members?tenantId=globex")
      .expect(200);
    expect(
      members.body.items.map((member: { id: string }) => member.id).sort(),
    ).toEqual(["acme-admin", "acme-member"]);
    expect(
      members.body.items.some(
        (member: { id: string }) => member.id === "globex-admin",
      ),
    ).toBe(false);
  });
});
