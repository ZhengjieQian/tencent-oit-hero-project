import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider, useI18n } from "../i18n.js";
import App from "../App.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function LanguageProbe() {
  const { language, setLanguage, t } = useI18n();
  return (
    <section>
      <p>{t("app.title.platform")}</p>
      <span>{language}</span>
      <button onClick={() => setLanguage("zh")}>中文</button>
      <button onClick={() => setLanguage("en")}>English</button>
    </section>
  );
}

describe("application language preference", () => {
  it("switches translated copy and remembers the selected language", () => {
    render(
      <I18nProvider>
        <LanguageProbe />
      </I18nProvider>,
    );

    expect(screen.getByText("Platform overview")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "中文" }));

    expect(screen.getByText("平台概览")).toBeInTheDocument();
    expect(localStorage.getItem("hero-language")).toBe("zh");
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(document.title).toBe("Northstar SaaS 管理平台");
  });

  it("restores the saved language on a new mount", () => {
    localStorage.setItem("hero-language", "zh");
    render(
      <I18nProvider>
        <LanguageProbe />
      </I18nProvider>,
    );

    expect(screen.getByText("平台概览")).toBeInTheDocument();
  });

  it("translates the visible platform directory from the top bar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ items: [
              { id: "platform-admin", email: "ops@northstar.example", role: "platform_admin", tenantId: null },
            ] }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ items: [
            {
              id: "acme", name: "Acme Studio", status: "active", subscriptionEndsAt: "2027-01-15",
              region: "North America", plan: "Growth", industry: "Design", employeeCount: 42,
              annualRecurringRevenueCents: 4_800_000, members: [],
            },
          ] }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
    );

    render(
      <I18nProvider>
        <App />
      </I18nProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Platform overview" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "中文" }));
    expect(screen.getByRole("heading", { name: "平台概览" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "租户目录" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "租户" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "状态" })).toBeInTheDocument();
  });
});
