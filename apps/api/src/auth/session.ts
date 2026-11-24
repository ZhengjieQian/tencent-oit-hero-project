import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { Actor } from "@hero/contracts";

export const SESSION_COOKIE = "hero_demo_session";

export class DemoSessions {
  private readonly actorIds = new Map<string, string>();

  constructor(private readonly db: Pool) {}

  async create(actorId: string): Promise<string | null> {
    const result = await this.db.query("SELECT id FROM users WHERE id = $1", [actorId]);
    if (result.rowCount === 0) return null;
    const token = randomUUID();
    this.actorIds.set(token, actorId);
    return token;
  }

  async resolve(token: string | undefined): Promise<Actor | null> {
    if (!token) return null;
    const actorId = this.actorIds.get(token);
    if (!actorId) return null;
    const result = await this.db.query<Actor>(
      'SELECT id AS "userId", email, role, tenant_id AS "tenantId" FROM users WHERE id = $1', [actorId],
    );
    return result.rows[0] ?? null;
  }
}
