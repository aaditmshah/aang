import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { UnsafeExtractError } from "../src/errors.js";
import type { None, Option, Some } from "../src/option.js";
import { none, some } from "../src/option.js";

const id = <A>(value: A): A => value;

const genSome = <A>(genValue: fc.Arbitrary<A>): fc.Arbitrary<Some<A>> =>
  genValue.map((value) => some(value));

const genNone: fc.Arbitrary<None> = fc.constant(none);

const genOption = <A>(genValue: fc.Arbitrary<A>): fc.Arbitrary<Option<A>> =>
  fc.oneof(genSome(genValue), genNone);

describe("option", () => {
  describe("map", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);
      fc.assert(
        fc.property(genOption(fc.anything()), (option) => {
          expect(option.map((value) => id(value))).toStrictEqual(option);
        }),
      );
    });
  });

  describe("unsafeExtract", () => {
    it("should extract the value from some", () => {
      expect.assertions(100);
      fc.assert(
        fc.property(fc.anything(), fc.string(), (value, message) => {
          expect(some(value).unsafeExtract(message)).toStrictEqual(value);
        }),
      );
    });

    it("should throw an UnsafeExtractError for none", () => {
      expect.assertions(100);
      fc.assert(
        fc.property(fc.string(), (message) => {
          expect(() => none.unsafeExtract(message)).toThrow(UnsafeExtractError);
        }),
      );
    });

    it("should throw the custom error for none", () => {
      expect.assertions(100);
      fc.assert(
        fc.property(fc.string(), (message) => {
          const error = new Error(message);
          expect(() => none.unsafeExtract(error)).toThrow(error);
        }),
      );
    });
  });
});
