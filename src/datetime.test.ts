import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { datetime } from "./arbitraries.test-util.js";

describe("DateTime", () => {
	describe("toString", () => {
		it("should convert DateTime to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(datetime, (m) => {
					expect(m.toString()).toStrictEqual(`DateTime(${m.value.getTime()})`);
				}),
			);
		});
	});
});
