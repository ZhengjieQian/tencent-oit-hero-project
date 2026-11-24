import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";
import type { Pool } from "pg";
import type { Actor, TenantSummary, TenantStatus } from "@hero/contracts";
import { DemoSessions, SESSION_COOKIE } from "./auth/session.js";

export function createApp(db: Pool) {
  const app = express();
  const sessions = new DemoSessions(db);
  app.use(express.json({ limit: "64kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.post("/api/dev/session", async (req, res) => {
    if (process.env.NODE_ENV === "production") return res.status(404).json({ error: "not_found" });
    const actorId = typeof req.body?.actorId === "string" ? req.body.actorId : "";
    const token = await sessions.create(actorId);
    if (!token) return res.status(400).json({ error: "unknown_demo_actor" });
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
    return res.json({ ok: true });
  });

  app.get("/api/dev/actors", async (_req, res) => {
    if (process.env.NODE_ENV === "production") return res.status(404).json({ error: "not_found" });
    const actors = await db.query('SELECT id, email, role, tenant_id AS "tenantId" FROM users ORDER BY id');
    return res.json({ items: actors.rows });
  });

  app.get("/api/operator/tenants", async (req, res) => {
    const actor = await requireActor(req, res, sessions);
    if (!actor) return;
    if (actor.role !== "platform_admin") return res.status(403).json({ error: "forbidden" });
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const result = await db.query<TenantSummary>(
      `SELECT id, name, status, subscription_ends_at AS "subscriptionEndsAt" FROM tenants
       WHERE ($1 = '' OR name ILIKE '%' || $1 || '%') ORDER BY lower(name)`, [query],
    );
    return res.json({ items: result.rows });
  });

  app.get("/api/tenant/current", async (req, res) => {
    const actor = await requireActor(req, res, sessions);
    if (!actor) return;
    if (!actor.tenantId || actor.role === "platform_admin") return res.status(403).json({ error: "tenant_user_required" });
    const result = await db.query<Pick<TenantSummary, "id" | "name" | "status">>(
      "SELECT id, name, status FROM tenants WHERE id = $1", [actor.tenantId],
    );
    const tenant = result.rows[0];
    if (!tenant) return res.status(404).json({ error: "tenant_not_found" });
    return res.json({ tenant });
  });

  app.get("/api/tenant/workspace", async (req, res) => {
    const actor = await requireActor(req, res, sessions);
    if (!actor) return;
    if (!actor.tenantId || actor.role === "platform_admin") return res.status(403).json({ error: "tenant_user_required" });
    const result = await db.query<{ id: string; status: TenantStatus }>(
      "SELECT id, status FROM tenants WHERE id = $1", [actor.tenantId],
    );
    const tenant = result.rows[0];
    if (!tenant) return res.status(404).json({ error: "tenant_not_found" });
    return res.json({ tenantId: tenant.id, workspace: { summary: "Your team's workspace is ready." } });
  });

  app.get("/api/tenant/members", async (req, res) => {
    const actor = await requireActor(req, res, sessions);
    if (!actor) return;
    if (!actor.tenantId || actor.role === "platform_admin") return res.status(403).json({ error: "tenant_user_required" });
    const result = await db.query(
      "SELECT id, email, role FROM users WHERE tenant_id = $1 ORDER BY email", [actor.tenantId],
    );
    return res.json({ items: result.rows });
  });

  app.patch("/api/operator/tenants/:tenantId/status", (_req, res) => res.status(501).json({ error: "not_implemented" }));
  return app;
}

async function requireActor(req: Request, res: Response, sessions: DemoSessions): Promise<Actor | null> {
  const actor = await sessions.resolve(req.cookies?.[SESSION_COOKIE]);
  if (!actor) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return actor;
}
