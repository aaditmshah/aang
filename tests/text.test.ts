import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Text } from "../src/text.js";

import { text } from "./arbitraries.js";

const toStringDefinition = (m: Text): void => {
	expect(m.toString()).toStrictEqual(`Text(${JSON.stringify(m.value)})`);
};

describe("Text", () => {
	describe("toString", () => {
		it("should convert Text to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(text, toStringDefinition));
		});
	});
});
