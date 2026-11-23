import { useEffect, useState } from "react";
import type { Actor } from "@hero/contracts";
import { api } from "./api.js";
import TenantDirectory from "./features/tenants/TenantDirectory.js";
import TenantConsole from "./features/tenant-console/TenantConsole.js";

interface DemoActor extends Omit<Actor, "userId"> {
  id: string;
}
interface ActorList {
  items: DemoActor[];
}

export default function App() {
  const [actors, setActors] = useState<DemoActor[]>([]);
  const [actor, setActor] = useState<DemoActor | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void api<ActorList>("/api/dev/actors")
      .then(async ({ items }) => {
        setActors(items);
        const initial =
          items.find((item) => item.id === "platform-admin") ?? items[0];
        if (initial) await switchActor(initial.id, items);
      })
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load demo accounts.",
        ),
      );
  }, []);

  async function switchActor(actorId: string, available: DemoActor[] = actors) {
    setError("");
    try {
      await api("/api/dev/session", {
        method: "POST",
        body: JSON.stringify({ actorId }),
      });
      const next = available.find((item) => item.id === actorId) ?? null;
      setActor(next);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not switch demo account.",
      );
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Northstar home">
          <span className="brand-mark">N</span>
          <span>
            northstar<small>SAAS PLATFORM</small>
          </span>
        </a>
        <div className="topbar-right">
          <label className="identity-label" htmlFor="demo-identity">
            DEMO IDENTITY
          </label>
          <select
            id="demo-identity"
            value={actor?.id ?? ""}
            onChange={(event) => void switchActor(event.target.value)}
          >
            {actors.map((item) => (
              <option value={item.id} key={item.id}>
                {item.email} · {item.role.replace("_", " ")}
              </option>
            ))}
          </select>
          <span className="avatar avatar-small">
            {actor?.email.slice(0, 1).toUpperCase() ?? "?"}
          </span>
        </div>
      </header>

      <main className="main-content">
        <div className="page-intro">
          <div>
            <p className="breadcrumb">
              {actor?.role === "platform_admin"
                ? "PLATFORM / CUSTOMERS"
                : "ORGANIZATION / WORKSPACE"}
            </p>
            <h1>
              {actor?.role === "platform_admin"
                ? "Platform overview"
                : "Organization console"}
            </h1>
            <p className="muted">
              {actor?.role === "platform_admin"
                ? "Monitor customer organizations and access."
                : "Manage your team's SaaS workspace."}
            </p>
          </div>
        </div>
        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}
        {!actor ? (
          error ? null : (
            <section className="panel empty-state" role="status">
              Preparing the demo workspace…
            </section>
          )
        ) : actor.role === "platform_admin" ? (
          <TenantDirectory />
        ) : (
          <TenantConsole key={actor.id} />
        )}
        <p className="demo-notice">
          <span aria-hidden="true">ⓘ</span> Demo identity switching is
          local-only and is not production authentication.
        </p>
      </main>
    </div>
  );
}
