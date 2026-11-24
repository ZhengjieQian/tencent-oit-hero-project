import { useEffect, useState } from "react";
import type { TenantStatusInfo } from "@hero/contracts";
import { api } from "../../api.js";
import { localizedError, localizedRole, useI18n } from "../../i18n.js";

interface Member {
  id: string;
  email: string;
  role: string;
}
interface TenantData {
  tenant: TenantStatusInfo;
}
interface MemberList {
  items: Member[];
}
interface WorkspaceData {
  workspace: { summary: string };
}

export default function TenantConsole() {
  const { t } = useI18n();
  const [tenant, setTenant] = useState<TenantStatusInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [workspace, setWorkspace] = useState("");
  const [error, setError] = useState<unknown>(null);

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
        if (active) setError(cause);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error)
    return (
      <p className="alert alert-error" role="alert">
        {localizedError(error, t("error.loadWorkspace"), t)}
      </p>
    );
  if (!tenant)
    return (
      <section className="panel empty-state" role="status">
        {t("console.loading")}
      </section>
    );
  if (tenant.status === "suspended")
    return (
      <section className="panel suspended-panel">
        <span className="status-pill status-suspended">
          {t("console.suspendedStatus")}
        </span>
        <h2>{t("console.suspendedTitle")}</h2>
        <p>
          {t("console.suspendedBody", { tenant: tenant.name })}
        </p>
      </section>
    );

  return (
    <div className="tenant-grid">
      <section className="panel workspace-card">
        <p className="eyebrow">{t("console.workspaceEyebrow")}</p>
        <h2>{tenant.name}</h2>
        <p className="muted">{workspace || t("console.loadingWorkspace")}</p>
        <span className="status-pill status-active">{t("console.active")}</span>
      </section>
      <section className="panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">{t("console.organizationEyebrow")}</p>
            <h2>{t("console.members")}</h2>
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
                  <small>{localizedRole(member.role, t)}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
