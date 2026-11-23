import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";
import type Database from "better-sqlite3";
import type { Actor, TenantSummary, TenantStatus } from "@hero/contracts";
import { DemoSessions, SESSION_COOKIE } from "./auth/session.js";

export function createApp(db: Database.Database) {
  const app = express();
  const sessions = new DemoSessions(db);
  app.use(express.json({ limit: "64kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.post("/api/dev/session", (req, res) => {
    if (process.env.NODE_ENV === "production")
      return res.status(404).json({ error: "not_found" });
    const actorId =
      typeof req.body?.actorId === "string" ? req.body.actorId : "";
    const token = sessions.create(actorId);
    if (!token) return res.status(400).json({ error: "unknown_demo_actor" });
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
    return res.json({ ok: true });
  });

  app.get("/api/dev/actors", (_req, res) => {
    if (process.env.NODE_ENV === "production")
      return res.status(404).json({ error: "not_found" });
    const actors = db
      .prepare(
        "SELECT id, email, role, tenant_id AS tenantId FROM users ORDER BY id",
      )
      .all();
    return res.json({ items: actors });
  });

  app.get("/api/operator/tenants", (req, res) => {
    const actor = requireActor(req, res, sessions);
    if (!actor) return;
    if (actor.role !== "platform_admin")
      return res.status(403).json({ error: "forbidden" });
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const items = db
      .prepare(
        `
      SELECT id, name, status, subscription_ends_at AS subscriptionEndsAt
      FROM tenants
      WHERE (? = '' OR lower(name) LIKE '%' || lower(?) || '%')
      ORDER BY name COLLATE NOCASE
    `,
      )
      .all(query, query) as TenantSummary[];
    return res.json({ items });
  });

  app.get("/api/tenant/current", (req, res) => {
    const actor = requireActor(req, res, sessions);
    if (!actor) return;
    if (!actor.tenantId || actor.role === "platform_admin")
      return res.status(403).json({ error: "tenant_user_required" });
    const tenant = db
      .prepare("SELECT id, name, status FROM tenants WHERE id = ?")
      .get(actor.tenantId) as
      | Pick<TenantSummary, "id" | "name" | "status">
      | undefined;
    if (!tenant) return res.status(404).json({ error: "tenant_not_found" });
    return res.json({ tenant });
  });

  app.get("/api/tenant/workspace", (req, res) => {
    const actor = requireActor(req, res, sessions);
    if (!actor) return;
    if (!actor.tenantId || actor.role === "platform_admin")
      return res.status(403).json({ error: "tenant_user_required" });
    const tenant = db
      .prepare("SELECT id, status FROM tenants WHERE id = ?")
      .get(actor.tenantId) as { id: string; status: TenantStatus } | undefined;
    if (!tenant) return res.status(404).json({ error: "tenant_not_found" });
    return res.json({
      tenantId: tenant.id,
      workspace: { summary: "Your team's workspace is ready." },
    });
  });

  app.get("/api/tenant/members", (req, res) => {
    const actor = requireActor(req, res, sessions);
    if (!actor) return;
    if (!actor.tenantId || actor.role === "platform_admin")
      return res.status(403).json({ error: "tenant_user_required" });
    const members = db
      .prepare(
        "SELECT id, email, role FROM users WHERE tenant_id = ? ORDER BY email",
      )
      .all(actor.tenantId);
    return res.json({ items: members });
  });

  app.patch("/api/operator/tenants/:tenantId/status", (_req, res) => {
    // TODO(candidate): implement the status update for the current stage.
    return res.status(501).json({ error: "not_implemented" });
  });

  return app;
}

function requireActor(
  req: Request,
  res: Response,
  sessions: DemoSessions,
): Actor | null {
  const actor = sessions.resolve(req.cookies?.[SESSION_COOKIE]);
  if (!actor) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return actor;
}
