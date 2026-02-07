import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Ordering } from "./ordering.js";

import { ordering } from "./arbitraries.test-util.js";
import { isLess, isMore, isNotLess, isNotMore, isNotSame, isSame } from "./ordering.js";

const isSameDefinition = (x: Ordering): void => {
	expect(isSame(x)).toStrictEqual(!isNotSame(x));
};

const isLessDefinition = (x: Ordering): void => {
	expect(isLess(x)).toStrictEqual(!isNotLess(x));
};

const isMoreDefinition = (x: Ordering): void => {
	expect(isMore(x)).toStrictEqual(!isNotMore(x));
};

describe("Ordering", () => {
	describe("isSame", () => {
		it("should agree with isNotSame", () => {
			expect.assertions(100);

			fc.assert(fc.property(ordering, isSameDefinition));
		});
	});

	describe("isLess", () => {
		it("should agree with isNotLess", () => {
			expect.assertions(100);

			fc.assert(fc.property(ordering, isLessDefinition));
		});
	});

	describe("isMore", () => {
		it("should agree with isNotMore", () => {
			expect.assertions(100);

			fc.assert(fc.property(ordering, isMoreDefinition));
		});
	});
});
