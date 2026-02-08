import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { text } from "./arbitraries.test-util.js";

describe("Text", () => {
	describe("toString", () => {
		it("should convert Text to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(text, (m) => {
					expect(m.toString()).toStrictEqual(`Text(${JSON.stringify(m.value)})`);
				}),
			);
		});
	});
});
