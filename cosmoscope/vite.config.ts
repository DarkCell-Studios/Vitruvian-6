import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html"],
    },
  },
});
