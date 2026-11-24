import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import TenantDirectory from "../features/tenants/TenantDirectory.js";
import { I18nProvider } from "../i18n.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("stage 1: tenant directory search and filters", () => {
  it("finds a tenant by a member email and combines status, region, and plan filters", async () => {
    const tenants = [
      {
        id: "acme", name: "Acme Studio", status: "active", subscriptionEndsAt: "2027-01-15",
        region: "North America", plan: "Growth", industry: "Design", employeeCount: 42,
        annualRecurringRevenueCents: 4_800_000,
        members: [{ id: "acme-admin", name: "Olivia Carter", email: "olivia.carter@acme.example", role: "tenant_admin", jobTitle: "Workspace administrator", joinedAt: "2024-03-12" }],
      },
      {
        id: "globex", name: "Globex Labs", status: "active", subscriptionEndsAt: "2026-12-01",
        region: "Europe", plan: "Enterprise", industry: "Industrial", employeeCount: 1280,
        annualRecurringRevenueCents: 128_000_000,
        members: [{ id: "globex-chloe", name: "Chloe Zhang", email: "chloe.zhang@globex.example", role: "member", jobTitle: "Operations analyst", joinedAt: "2024-02-08" }],
      },
      {
        id: "initech", name: "Initech Systems", status: "active", subscriptionEndsAt: "2027-06-30",
        region: "Asia Pacific", plan: "Growth", industry: "Technology", employeeCount: 185,
        annualRecurringRevenueCents: 42_000_000,
        members: [{ id: "initech-alina", name: "Alina Park", email: "alina.park@initech.example", role: "member", jobTitle: "Data analyst", joinedAt: "2025-03-05" }],
      },
      {
        id: "umbrella", name: "Umbrella Health", status: "suspended", subscriptionEndsAt: "2027-03-31",
        region: "North America", plan: "Starter", industry: "Healthcare", employeeCount: 24,
        annualRecurringRevenueCents: 2_400_000,
        members: [{ id: "umbrella-lin", name: "Lin Wei", email: "lin.wei@umbrella.example", role: "member", jobTitle: "Clinical operations lead", joinedAt: "2024-05-14" }],
      },
    ];
    const fetchMock = vi.fn().mockImplementation(
      async () => new Response(JSON.stringify({ items: tenants }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <I18nProvider>
        <TenantDirectory />
      </I18nProvider>,
    );

    expect(await screen.findByText("Globex Labs")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Search tenants and people" }), {
      target: { value: "chloe.zhang@globex.example" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    const table = await screen.findByRole("table");
    await waitFor(() => {
      expect(within(table).queryByText("Acme Studio")).not.toBeInTheDocument();
    });
    expect(within(table).getByText("Globex Labs")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "active" } });
    fireEvent.change(screen.getByLabelText("Region"), { target: { value: "Europe" } });
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "Enterprise" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(within(table).getByText("Globex Labs")).toBeInTheDocument();
    expect(within(table).queryByText("Acme Studio")).not.toBeInTheDocument();
    expect(within(table).queryByText("Initech Systems")).not.toBeInTheDocument();
    expect(within(table).queryByText("Umbrella Health")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
