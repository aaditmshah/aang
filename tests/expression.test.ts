import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { evaluate, fromValue } from "../src/expression.js";

const evaluateFromValueIdentity = <A>(value: A): void => {
  expect(evaluate(fromValue(value))).toStrictEqual(value);
};

describe("Expression", () => {
  describe("evaluateFromValue", () => {
    it("should behave like identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.oneof(fc.anything(), fc.func(fc.anything())),
          evaluateFromValueIdentity,
        ),
      );
    });
  });
});
