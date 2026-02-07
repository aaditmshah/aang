import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.test-util.ts"],
	platform: "neutral",
	outDir: "lib",
	unbundle: true,
	exports: true,
	dts: true,
});
