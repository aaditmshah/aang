import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { double } from "./arbitraries.test-util.js";

describe("Double", () => {
	describe("toString", () => {
		it("should convert Double to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(double, (m) => {
					expect(m.toString()).toStrictEqual(`Double(${m.value})`);
				}),
			);
		});
	});
});
