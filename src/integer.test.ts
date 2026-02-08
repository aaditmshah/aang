import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { integer, product, sum } from "./arbitraries.test-util.js";

describe("Integer", () => {
	describe("toString", () => {
		it("should convert Integer to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(integer, (m) => {
					expect(m.toString()).toStrictEqual(`Integer(${m.value})`);
				}),
			);
		});
	});
});

describe("Sum", () => {
	describe("toString", () => {
		it("should convert Sum to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(sum, (m) => {
					expect(m.toString()).toStrictEqual(`Sum(${m.value})`);
				}),
			);
		});
	});
});

describe("Product", () => {
	describe("toString", () => {
		it("should convert Product to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(product, (m) => {
					expect(m.toString()).toStrictEqual(`Product(${m.value})`);
				}),
			);
		});
	});
});
