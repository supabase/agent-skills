import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		testTimeout: 180000, // 3 minute timeout for sanity tests
		hookTimeout: 180000,
	},
});
