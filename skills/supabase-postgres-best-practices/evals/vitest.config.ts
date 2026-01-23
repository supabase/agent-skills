import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["scenarios/**/*.eval.ts"],
    testTimeout: 60000, // 60 seconds for LLM calls
    reporters: ["verbose"],
  },
});
