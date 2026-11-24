import { useEffect, useState } from "react";
import type { TenantSummary, TenantStatus } from "@hero/contracts";
import { api } from "../../api.js";

interface TenantListResponse {
  items: TenantSummary[];
}
interface TenantResponse {
  tenant: TenantSummary;
}

export default function TenantDirectory() {
  const [items, setItems] = useState<TenantSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<TenantSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadTenants(search = query) {
    setLoading(true);
    setError("");
    try {
      const result = await api<TenantListResponse>(
        `/api/operator/tenants?q=${encodeURIComponent(search)}`,
      );
      setItems(result.items);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load tenants.",
      );
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
    setError("");
    setMessage("");
    try {
      await api<TenantResponse>(
        `/api/operator/tenants/${confirmation.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      setMessage(`${confirmation.name} updated successfully.`);
      setConfirmation(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update tenant.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="tenant-directory-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">CUSTOMER ACCOUNTS</p>
          <h2 id="tenant-directory-title">Tenant directory</h2>
          <p className="muted">
            Manage customer access and subscription status.
          </p>
        </div>
        <div className="metric">
          <span>{items.length}</span>
          <small>tenants shown</small>
        </div>
      </div>

      <form
        className="search-row"
        onSubmit={(event) => {
          event.preventDefault();
          void loadTenants(query);
        }}
      >
        <label className="sr-only" htmlFor="tenant-search">
          Search tenants
        </label>
        <input
          id="tenant-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by tenant name"
        />
        <button className="button button-secondary" type="submit">
          Search
        </button>
      </form>

      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="alert alert-success" role="status">
          {message}
        </p>
      )}
      {loading ? (
        <p className="empty-state" role="status">
          Loading tenants…
        </p>
      ) : items.length === 0 ? (
        <p className="empty-state">No tenants match this search.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Subscription through</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
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
                    {new Date(
                      `${tenant.subscriptionEndsAt}T00:00:00`,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <span className={`status-pill status-${tenant.status}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button
                      className="button button-quiet"
                      onClick={() => setConfirmation(tenant)}
                      type="button"
                    >
                      {tenant.status === "active" ? "Suspend" : "Reactivate"}
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
            <p className="eyebrow">CONFIRM TENANT CHANGE</p>
            <h3 id="confirm-title">
              {nextStatus === "suspended" ? "Suspend" : "Reactivate"}{" "}
              {confirmation.name}?
            </h3>
            <p className="muted">
              {nextStatus === "suspended"
                ? "Tenant members will lose console access. Their data will remain available."
                : "Tenant members will regain console access."}
            </p>
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                onClick={() => setConfirmation(null)}
                type="button"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={() => void confirmStatusChange()}
                type="button"
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : `Confirm ${nextStatus === "suspended" ? "suspension" : "reactivation"}`}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
