import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TenantDirectory from "../features/tenants/TenantDirectory.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("stage 1: tenant search", () => {
  it("shows only tenants matching the submitted search", async () => {
    const allTenants = [
      { id: "acme", name: "Acme Studio", status: "active", subscriptionEndsAt: "2027-01-15" },
      { id: "globex", name: "Globex Labs", status: "active", subscriptionEndsAt: "2026-12-01" },
    ];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const items = url.includes("q=Acme") ? [allTenants[0]] : allTenants;
      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<TenantDirectory />);
    expect(await screen.findByText("Globex Labs")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Search tenants" }), {
      target: { value: "Acme" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("Acme Studio")).toBeInTheDocument();
    expect(screen.queryByText("Globex Labs")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/operator/tenants?q=Acme",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });
});
