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
      "@workspace/db": path.resolve(__dirname, "tests/__mocks__/db.ts"),
      "drizzle-orm": path.resolve(__dirname, "tests/__mocks__/drizzle-orm.ts"),
    },
  },
});
