import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import TenantDirectory from "../features/tenants/TenantDirectory.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("tenant directory starter", () => {
  it("loads tenant names and status from the operator API", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              items: [
                {
                  id: "acme",
                  name: "Acme Studio",
                  status: "active",
                  subscriptionEndsAt: "2027-01-15",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
    );
    render(<TenantDirectory />);
    expect(await screen.findByText("Acme Studio")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
