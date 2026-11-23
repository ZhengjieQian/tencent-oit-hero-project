import { useEffect, useState } from "react";
import type { TenantSummary } from "@hero/contracts";
import { api } from "../../api.js";

interface Member {
  id: string;
  email: string;
  role: string;
}
interface TenantData {
  tenant: TenantSummary;
}
interface MemberList {
  items: Member[];
}
interface WorkspaceData {
  workspace: { summary: string };
}

export default function TenantConsole() {
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [workspace, setWorkspace] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void api<TenantData>("/api/tenant/current")
      .then(async ({ tenant: current }) => {
        if (!active) return;
        setTenant(current);
        if (current.status === "suspended") return;
        const [team, home] = await Promise.all([
          api<MemberList>("/api/tenant/members"),
          api<WorkspaceData>("/api/tenant/workspace"),
        ]);
        if (active) {
          setMembers(team.items);
          setWorkspace(home.workspace.summary);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load tenant workspace.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  if (error)
    return (
      <p className="alert alert-error" role="alert">
        {error}
      </p>
    );
  if (!tenant)
    return (
      <section className="panel empty-state" role="status">
        Loading tenant workspace…
      </section>
    );
  if (tenant.status === "suspended")
    return (
      <section className="panel suspended-panel">
        <span className="status-pill status-suspended">Suspended</span>
        <h2>Workspace access is paused</h2>
        <p>
          {tenant.name} is currently suspended. Your data is preserved. Contact
          your platform operator if you believe this is a mistake.
        </p>
      </section>
    );

  return (
    <div className="tenant-grid">
      <section className="panel workspace-card">
        <p className="eyebrow">TENANT WORKSPACE</p>
        <h2>{tenant.name}</h2>
        <p className="muted">{workspace || "Loading workspace…"}</p>
        <span className="status-pill status-active">Active</span>
      </section>
      <section className="panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">YOUR ORGANIZATION</p>
            <h2>Team members</h2>
          </div>
          <span className="count-badge">{members.length}</span>
        </div>
        <ul className="member-list">
          {members.map((member) => (
            <li key={member.id}>
              <span className="avatar">
                {member.email.slice(0, 1).toUpperCase()}
              </span>
              <span className="member-info">
                <strong>{member.email}</strong>
                <small>{member.role.replace("_", " ")}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
