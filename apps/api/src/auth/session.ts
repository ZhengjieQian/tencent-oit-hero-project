import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { Actor } from "@hero/contracts";

export const SESSION_COOKIE = "hero_demo_session";

export class DemoSessions {
  private readonly actorIds = new Map<string, string>();

  constructor(private readonly db: Database.Database) {}

  create(actorId: string): string | null {
    const exists = this.db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(actorId);
    if (!exists) return null;
    const token = randomUUID();
    this.actorIds.set(token, actorId);
    return token;
  }

  resolve(token: string | undefined): Actor | null {
    if (!token) return null;
    const actorId = this.actorIds.get(token);
    if (!actorId) return null;
    return (
      (this.db
        .prepare(
          "SELECT id AS userId, email, role, tenant_id AS tenantId FROM users WHERE id = ?",
        )
        .get(actorId) as Actor | undefined) ?? null
    );
  }
}
