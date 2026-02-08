import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { all, any, bool } from "./arbitraries.test-util.js";

describe("Bool", () => {
	describe("toString", () => {
		it("should convert Bool to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(bool, (m) => {
					expect(m.toString()).toStrictEqual(`Bool(${m.value})`);
				}),
			);
		});
	});
});

describe("Any", () => {
	describe("toString", () => {
		it("should convert Any to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(any, (m) => {
					expect(m.toString()).toStrictEqual(`Any(${m.value})`);
				}),
			);
		});
	});
});

describe("All", () => {
	describe("toString", () => {
		it("should convert All to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(all, (m) => {
					expect(m.toString()).toStrictEqual(`All(${m.value})`);
				}),
			);
		});
	});
});
