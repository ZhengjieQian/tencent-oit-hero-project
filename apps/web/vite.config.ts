import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = fileURLToPath(new URL(".", import.meta.url));
const contractsRoot = resolve(webRoot, "../../packages/contracts");

const config = defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    strictPort: true,
    fs: {
      strict: true,
      allow: [webRoot, contractsRoot],
      deny: [
        "**/interviewer-materials/**",
        "**/docs/superpowers/**",
        "**/apps/api/data/**",
        "**/*.sqlite",
        "**/*.sqlite-*",
      ],
    },
    proxy: { "/api": "http://127.0.0.1:3001" },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
  },
});

export default config;
