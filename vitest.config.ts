import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			enabled: true,
			include: ["src/**/*.ts"],
			exclude: ["tests/**/*.ts"],
			thresholds: { "100": true },
		},
	},
});
