import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Double } from "./double.js";

import { double } from "./arbitraries.test-util.js";

const toStringDefinition = (m: Double): void => {
	expect(m.toString()).toStrictEqual(`Double(${m.value})`);
};

describe("Double", () => {
	describe("toString", () => {
		it("should convert Double to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(double, toStringDefinition));
		});
	});
});
