import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { ordering } from "./arbitraries.test-util.js";
import { isLess, isMore, isNotLess, isNotMore, isNotSame, isSame } from "./ordering.js";

describe("Ordering", () => {
	describe("isSame", () => {
		it("should agree with isNotSame", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(ordering, (x) => {
					expect(isSame(x)).toStrictEqual(!isNotSame(x));
				}),
			);
		});
	});

	describe("isLess", () => {
		it("should agree with isNotLess", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(ordering, (x) => {
					expect(isLess(x)).toStrictEqual(!isNotLess(x));
				}),
			);
		});
	});

	describe("isMore", () => {
		it("should agree with isNotMore", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(ordering, (x) => {
					expect(isMore(x)).toStrictEqual(!isNotMore(x));
				}),
			);
		});
	});
});
