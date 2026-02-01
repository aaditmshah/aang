import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { All, Any, Bool } from "../src/bool.js";

import { all, any, bool } from "./arbitraries.js";

const boolToStringDefinition = (m: Bool): void => {
	expect(m.toString()).toStrictEqual(`Bool(${m.value})`);
};

const anyToStringDefinition = (m: Any): void => {
	expect(m.toString()).toStrictEqual(`Any(${m.value})`);
};

const allToStringDefinition = (m: All): void => {
	expect(m.toString()).toStrictEqual(`All(${m.value})`);
};

describe("Bool", () => {
	describe("toString", () => {
		it("should convert Bool to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(bool, boolToStringDefinition));
		});
	});
});

describe("Any", () => {
	describe("toString", () => {
		it("should convert Any to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(any, anyToStringDefinition));
		});
	});
});

describe("All", () => {
	describe("toString", () => {
		it("should convert All to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(all, allToStringDefinition));
		});
	});
});
