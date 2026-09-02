import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
