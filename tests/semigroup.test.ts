import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { All, Any } from "../src/bool.js";
import { Product, Sum } from "../src/integer.js";
import type { Setoid } from "../src/order.js";
import type { Semigroup } from "../src/semigroup.js";
import { Text } from "../src/text.js";

import { option } from "./arbitraries.js";

const testSemigroup = <A extends Semigroup<A> & Setoid<A>>(
  name: string,
  value: fc.Arbitrary<A>,
): void => {
  const appendAssociativity = (x: A, y: A, z: A): void => {
    expect(x.append(y.append(z)).isSame(x.append(y).append(z))).toStrictEqual(
      true,
    );
  };

  describe(`Semigroup<${name}>`, () => {
    describe("append", () => {
      it("should be associative", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, value, appendAssociativity));
      });
    });
  });
};

testSemigroup("Text", fc.string().map(Text.of));
testSemigroup("Sum", fc.bigUint().map(Sum.of));
testSemigroup("Product", fc.bigUint().map(Product.of));
testSemigroup("Any", fc.boolean().map(Any.of));
testSemigroup("All", fc.boolean().map(All.of));
testSemigroup("Option<Text>", option(fc.string().map(Text.of)));
