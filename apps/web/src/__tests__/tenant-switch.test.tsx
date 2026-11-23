import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "../App.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("demo tenant identity switching", () => {
  it("loads the selected tenant instead of retaining the previous tenant's members", async () => {
    const actors = [
      {
        id: "platform-admin",
        email: "ops@northstar.example",
        role: "platform_admin",
        tenantId: null,
      },
      {
        id: "acme-admin",
        email: "admin@acme.example",
        role: "tenant_admin",
        tenantId: "acme",
      },
      {
        id: "globex-admin",
        email: "admin@globex.example",
        role: "tenant_admin",
        tenantId: "globex",
      },
    ];
    let currentActorId = "platform-admin";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "/api/dev/actors") return json({ items: actors });
        if (url === "/api/dev/session") {
          currentActorId = (
            JSON.parse(String(init?.body)) as { actorId: string }
          ).actorId;
          return json({ ok: true });
        }
        if (url === "/api/operator/tenants?q=") return json({ items: [] });
        const tenantId = currentActorId === "acme-admin" ? "acme" : "globex";
        const tenantName = tenantId === "acme" ? "Acme Studio" : "Globex Labs";
        if (url === "/api/tenant/current")
          return json({
            tenant: { id: tenantId, name: tenantName, status: "active" },
          });
        if (url === "/api/tenant/workspace")
          return json({ workspace: { summary: `${tenantName} workspace` } });
        if (url === "/api/tenant/members")
          return json({
            items: [
              {
                id: `${tenantId}-admin`,
                email: `admin@${tenantId}.example`,
                role: "tenant_admin",
              },
            ],
          });
        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    render(<App />);
    const selector = await screen.findByLabelText("DEMO IDENTITY");
    fireEvent.change(selector, { target: { value: "acme-admin" } });
    expect(
      await screen.findByRole("heading", { name: "Acme Studio" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("admin@acme.example")).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "globex-admin" } });
    expect(
      await screen.findByRole("heading", { name: "Globex Labs" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("admin@globex.example")).toBeInTheDocument();
    expect(screen.queryByText("admin@acme.example")).not.toBeInTheDocument();
  });
});

function json(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
