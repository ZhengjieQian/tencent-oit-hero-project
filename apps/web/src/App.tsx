import { useEffect, useState } from "react";
import type { Actor } from "@hero/contracts";
import { api } from "./api.js";
import TenantDirectory from "./features/tenants/TenantDirectory.js";
import TenantConsole from "./features/tenant-console/TenantConsole.js";
import { localizedError, localizedRole, useI18n } from "./i18n.js";

interface DemoActor extends Omit<Actor, "userId"> {
  id: string;
}
interface ActorList {
  items: DemoActor[];
}

export default function App() {
  const { language, setLanguage, t } = useI18n();
  const [actors, setActors] = useState<DemoActor[]>([]);
  const [actor, setActor] = useState<DemoActor | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    void api<ActorList>("/api/dev/actors")
      .then(async ({ items }) => {
        setActors(items);
        const initial =
          items.find((item) => item.id === "platform-admin") ?? items[0];
        if (initial) await switchActor(initial.id, items);
      })
      .catch((cause: unknown) => setError(cause));
  }, []);

  async function switchActor(actorId: string, available: DemoActor[] = actors) {
    setError(null);
    try {
      await api("/api/dev/session", {
        method: "POST",
        body: JSON.stringify({ actorId }),
      });
      const next = available.find((item) => item.id === actorId) ?? null;
      setActor(next);
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label={t("brand.home")}>
          <span className="brand-mark">N</span>
          <span>
            northstar<small>{t("brand.subtitle")}</small>
          </span>
        </a>
        <div className="topbar-right">
          <div
            className="segmented language-switch"
            role="group"
            aria-label={t("language.label")}
          >
            <button
              type="button"
              aria-pressed={language === "zh"}
              onClick={() => setLanguage("zh")}
            >
              中文
            </button>
            <button
              type="button"
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
          </div>
          <label className="identity-label" htmlFor="demo-identity">
            {t("identity.label")}
          </label>
          <select
            id="demo-identity"
            value={actor?.id ?? ""}
            onChange={(event) => void switchActor(event.target.value)}
          >
            {actors.map((item) => (
              <option value={item.id} key={item.id}>
                {item.email} · {localizedRole(item.role, t)}
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
                ? t("breadcrumb.platform")
                : t("breadcrumb.organization")}
            </p>
            <h1>
              {actor?.role === "platform_admin"
                ? t("app.title.platform")
                : t("app.title.organization")}
            </h1>
            <p className="muted">
              {actor?.role === "platform_admin"
                ? t("app.description.platform")
                : t("app.description.organization")}
            </p>
          </div>
        </div>
        {error !== null && (
          <p className="alert alert-error" role="alert">
            {localizedError(error, t("error.loadAccounts"), t)}
          </p>
        )}
        {!actor ? (
          error ? null : (
            <section className="panel empty-state" role="status">
              {t("app.loading")}
            </section>
          )
        ) : actor.role === "platform_admin" ? (
          <TenantDirectory />
        ) : (
          <TenantConsole key={actor.id} />
        )}
        <p className="demo-notice">
          <span aria-hidden="true">ⓘ</span> {t("app.demoNotice")}
        </p>
      </main>
    </div>
  );
}
