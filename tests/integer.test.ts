import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Integer, Product, Sum } from "../src/integer.js";

import { integer, product, sum } from "./arbitraries.js";

const integerToStringDefinition = (m: Integer): void => {
	expect(m.toString()).toStrictEqual(`Integer(${m.value})`);
};

const sumToStringDefinition = (m: Sum): void => {
	expect(m.toString()).toStrictEqual(`Sum(${m.value})`);
};

const productToStringDefinition = (m: Product): void => {
	expect(m.toString()).toStrictEqual(`Product(${m.value})`);
};

describe("Integer", () => {
	describe("toString", () => {
		it("should convert Integer to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(integer, integerToStringDefinition));
		});
	});
});

describe("Sum", () => {
	describe("toString", () => {
		it("should convert Sum to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(sum, sumToStringDefinition));
		});
	});
});

describe("Product", () => {
	describe("toString", () => {
		it("should convert Product to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(product, productToStringDefinition));
		});
	});
});
