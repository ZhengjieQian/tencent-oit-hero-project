import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import TenantDirectory from "../features/tenants/TenantDirectory.js";
import { I18nProvider } from "../i18n.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("tenant directory starter", () => {
  it("loads tenant names and status from the operator API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [
              {
                id: "acme",
                name: "Acme Studio",
                status: "active",
                subscriptionEndsAt: "2027-01-15",
                region: "North America",
                plan: "Growth",
                industry: "Design",
                employeeCount: 42,
                annualRecurringRevenueCents: 4_800_000,
                members: [],
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    render(
      <I18nProvider>
        <TenantDirectory />
      </I18nProvider>,
    );
    expect(await screen.findByText("Acme Studio")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
