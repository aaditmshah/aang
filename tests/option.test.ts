import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { UnsafeExtractError } from "../src/errors.js";
import { Exception } from "../src/exceptions.js";
import type { None, Option, Some } from "../src/option.js";
import { none, some } from "../src/option.js";

const id = <A>(value: A): A => value;

const genSome = <A>(genValue: fc.Arbitrary<A>): fc.Arbitrary<Some<A>> =>
  genValue.map((value) => some(value));

const genNone: fc.Arbitrary<None> = fc.constant(none);

const genOption = <A>(genValue: fc.Arbitrary<A>): fc.Arbitrary<Option<A>> =>
  fc.oneof(genSome(genValue), genNone);

describe("Option", () => {
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

  describe("safeExtract", () => {
    it("should extract the value from Some", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.anything(), fc.anything(), (value, defaultValue) => {
          expect(some(value).safeExtract(defaultValue)).toStrictEqual(value);
        }),
      );
    });

    it("should return the default value for None", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.anything(), (defaultValue) => {
          expect(none.safeExtract(defaultValue)).toStrictEqual(defaultValue);
        }),
      );
    });
  });

  describe("safeExtractFrom", () => {
    it("should extract the value from Some", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.anything(),
          fc.func(fc.anything()),
          (value, getDefaultValue) => {
            expect(some(value).safeExtractFrom(getDefaultValue)).toStrictEqual(
              value,
            );
          },
        ),
      );
    });

    it("should return the default value for None", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.func(fc.anything()), (getDefaultValue) => {
          expect(none.safeExtractFrom(getDefaultValue)).toStrictEqual(
            getDefaultValue(),
          );
        }),
      );
    });
  });

  describe("unsafeExtract", () => {
    it("should extract the value from Some", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.anything(), fc.string(), (value, message) => {
          expect(some(value).unsafeExtract(message)).toStrictEqual(value);
        }),
      );
    });

    it("should throw an UnsafeExtractError for None", () => {
      expect.assertions(200);

      fc.assert(
        fc.property(fc.string(), (message) => {
          const error = new UnsafeExtractError(message);
          expect(() => none.unsafeExtract(message)).toThrow(error);
          expect(() => none.unsafeExtract(message)).toThrow(UnsafeExtractError);
        }),
      );
    });

    it("should throw the given exception for None", () => {
      expect.assertions(200);

      fc.assert(
        fc.property(fc.string(), (message) => {
          class SomeException extends Exception {}
          const error = new SomeException(message);
          expect(() => none.unsafeExtract(error)).toThrow(error);
          expect(() => none.unsafeExtract(error)).toThrow(SomeException);
        }),
      );
    });
  });
});
