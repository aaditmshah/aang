import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { DateTime } from "./datetime.js";

import { datetime } from "./arbitraries.test-util.js";

const toStringDefinition = (m: DateTime): void => {
	expect(m.toString()).toStrictEqual(`DateTime(${m.value.getTime()})`);
};

describe("DateTime", () => {
	describe("toString", () => {
		it("should convert DateTime to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(datetime, toStringDefinition));
		});
	});
});
