import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@/context/OracleContext": path.resolve(__dirname, "tests/__stubs__/OracleContextTypes.ts"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
