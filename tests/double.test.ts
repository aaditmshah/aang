import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import type { Double } from "../src/double.js";

import { double } from "./arbitraries.js";

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
