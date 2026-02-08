import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Semigroup } from "./semigroup.js";

import { all, any, option, product, sum, text } from "./arbitraries.test-util.js";

const testSemigroup = <A extends Semigroup<A>>(name: string, value: fc.Arbitrary<A>) => {
	describe(`Semigroup<${name}>`, () => {
		describe("append", () => {
			it("should be associative", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, value, (x: A, y: A, z: A) => {
						expect(x.append(y.append(z))).toStrictEqual(x.append(y).append(z));
					}),
				);
			});
		});
	});
};

testSemigroup("Text", text);
testSemigroup("Sum", sum);
testSemigroup("Product", product);
testSemigroup("Any", any);
testSemigroup("All", all);
testSemigroup("Option<Text>", option(text));
