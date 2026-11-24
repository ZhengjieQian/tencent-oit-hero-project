import { useEffect, useState } from "react";
import type { TenantSummary, TenantStatus } from "@hero/contracts";
import { api } from "../../api.js";
import {
  localizedError,
  localizedPlan,
  localizedRegion,
  useI18n,
} from "../../i18n.js";

interface TenantListResponse {
  items: TenantSummary[];
}
interface TenantResponse {
  tenant: TenantSummary;
}

export default function TenantDirectory() {
  const { language, t } = useI18n();
  const [items, setItems] = useState<TenantSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [confirmation, setConfirmation] = useState<TenantSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const currency = new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  async function loadTenants(search = query) {
    setLoading(true);
    setError(null);
    try {
      const result = await api<TenantListResponse>(
        `/api/operator/tenants?q=${encodeURIComponent(search)}`,
      );
      setItems(result.items);
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTenants("");
  }, []);

  const nextStatus: TenantStatus | null = confirmation
    ? confirmation.status === "active"
      ? "suspended"
      : "active"
    : null;

  async function confirmStatusChange() {
    if (!confirmation || !nextStatus) return;
    setSaving(true);
    setError(null);
    setMessage("");
    try {
      await api<TenantResponse>(
        `/api/operator/tenants/${confirmation.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      setMessage(confirmation.name);
      setConfirmation(null);
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="tenant-directory-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t("directory.eyebrow")}</p>
          <h2 id="tenant-directory-title">{t("directory.title")}</h2>
          <p className="muted">
            {t("directory.description")}
          </p>
        </div>
        <div className="metric">
          <span>{items.length}</span>
          <small>{t("directory.count")}</small>
        </div>
      </div>

      <form
        className="search-row"
        onSubmit={(event) => {
          event.preventDefault();
          void loadTenants("");
        }}
      >
        <label className="sr-only" htmlFor="tenant-search">
          {t("directory.searchLabel")}
        </label>
        <input
          id="tenant-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("directory.searchPlaceholder")}
        />
        <button className="button button-secondary" type="submit">
          {t("directory.search")}
        </button>
      </form>

      {error !== null && (
        <p className="alert alert-error" role="alert">
          {localizedError(error, t("error.loadTenants"), t)}
        </p>
      )}
      {message && (
        <p className="alert alert-success" role="status">
          {t("directory.updated", { tenant: message })}
        </p>
      )}
      {loading ? (
        <p className="empty-state" role="status">
          {t("directory.loading")}
        </p>
      ) : items.length === 0 ? (
        <p className="empty-state">{t("directory.empty")}</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("directory.column.tenant")}</th>
                <th>{t("directory.column.people")}</th>
                <th>{t("directory.column.region")}</th>
                <th>{t("directory.column.plan")}</th>
                <th>{t("directory.column.employees")}</th>
                <th>{t("directory.column.arr")}</th>
                <th>{t("directory.column.subscription")}</th>
                <th>{t("directory.column.status")}</th>
                <th>
                  <span className="sr-only">{t("directory.column.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <strong>{tenant.name}</strong>
                    <small className="table-subtitle">{tenant.id}</small>
                  </td>
                  <td>
                    <details className="people-details">
                      <summary>
                        {t("directory.memberCount", {
                          count: tenant.members.length,
                        })}
                      </summary>
                      <ul>
                        {tenant.members.map((member) => (
                          <li key={member.id}>
                            <strong>{member.name}</strong>
                            <small>{member.email}</small>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                  <td>{localizedRegion(tenant.region, t)}</td>
                  <td>{localizedPlan(tenant.plan, t)}</td>
                  <td>{tenant.employeeCount.toLocaleString(language === "zh" ? "zh-CN" : "en-US")}</td>
                  <td>{currency.format(tenant.annualRecurringRevenueCents / 100)}</td>
                  <td>
                    {new Date(
                      `${tenant.subscriptionEndsAt}T00:00:00`,
                    ).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <span className={`status-pill status-${tenant.status}`}>
                      {tenant.status === "active"
                        ? t("directory.status.active")
                        : t("directory.status.suspended")}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button
                      className="button button-quiet"
                      onClick={() => setConfirmation(tenant)}
                      type="button"
                    >
                      {tenant.status === "active"
                        ? t("directory.action.suspend")
                        : t("directory.action.reactivate")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmation && nextStatus && (
        <div className="dialog-backdrop">
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <p className="eyebrow">{t("directory.confirm.eyebrow")}</p>
            <h3 id="confirm-title">
              {t(
                nextStatus === "suspended"
                  ? "directory.confirm.suspendTitle"
                  : "directory.confirm.reactivateTitle",
                { tenant: confirmation.name },
              )}
            </h3>
            <p className="muted">
              {t(
                nextStatus === "suspended"
                  ? "directory.confirm.suspendBody"
                  : "directory.confirm.reactivateBody",
              )}
            </p>
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                onClick={() => setConfirmation(null)}
                type="button"
                disabled={saving}
              >
                {t("directory.confirm.cancel")}
              </button>
              <button
                className="button button-primary"
                onClick={() => void confirmStatusChange()}
                type="button"
                disabled={saving}
              >
                {saving
                  ? t("directory.confirm.saving")
                  : t(
                      nextStatus === "suspended"
                        ? "directory.confirm.suspend"
                        : "directory.confirm.reactivate",
                    )}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
