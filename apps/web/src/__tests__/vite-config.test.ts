// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import viteConfig from "../../vite.config.js";

describe("local Vite server boundary", () => {
  it("binds to loopback and only serves the web app and shared contracts", () => {
    const server = viteConfig.server;
    expect(server?.host).toBe("127.0.0.1");
    expect(server?.strictPort).toBe(true);
    expect(server?.fs?.strict).toBe(true);
    expect(server?.fs?.allow).toHaveLength(2);
    expect(server?.fs?.allow?.map((path) => resolve(path))).toEqual([
      process.cwd(),
      resolve(process.cwd(), "../../packages/contracts"),
    ]);
    expect(server?.fs?.deny).toContain("**/interviewer-materials/**");
    expect(server?.proxy?.["/api"]).toBe("http://127.0.0.1:3001");
  });
});
