import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { defineValue, evaluate, fromValue } from "../src/expression.js";

import { expression } from "./arbitraries.js";

class Identity<out A> {
  public readonly value!: A;

  public constructor(value: A) {
    defineValue(this, "value", value);
  }
}

const defineValueIdentity = <A>(value: A): void => {
  expect(
    Object.getOwnPropertyDescriptor(new Identity(value), "value"),
  ).toStrictEqual(Object.getOwnPropertyDescriptor({ value }, "value"));
};

const evaluateFromValueIdentity = <A>(value: A): void => {
  expect(evaluate(fromValue(value))).toStrictEqual(value);
};

describe("Expression", () => {
  describe("defineValue", () => {
    it("should behave like identity", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), defineValueIdentity));
    });
  });

  describe("evaluateFromValue", () => {
    it("should behave like identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(expression(fc.anything()), evaluateFromValueIdentity),
      );
    });
  });
});
