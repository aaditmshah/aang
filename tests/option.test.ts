import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { UnsafeExtractError } from "../src/errors.js";
import { Exception } from "../src/exceptions.js";
import type { Option } from "../src/option.js";
import { None, Some } from "../src/option.js";
import { Failure, Success } from "../src/result.js";

const id = <A>(value: A): A => value;

const genSome = <A>(genValue: fc.Arbitrary<A>): fc.Arbitrary<Some<A>> =>
  genValue.map((value) => new Some(value));

const genNone: fc.Arbitrary<None> = fc.constant(None.instance);

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

  describe("flatMap", () => {
    it("should have a left identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.anything(),
          fc.func(genOption(fc.anything())),
          (value, arrow) => {
            expect(
              new Some(value).flatMap((value) => arrow(value)),
            ).toStrictEqual(arrow(value));
          },
        ),
      );
    });

    it("should have a right identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(genOption(fc.anything()), (option) => {
          expect(option.flatMap((value) => new Some(value))).toStrictEqual(
            option,
          );
        }),
      );
    });

    it("should be associative", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          genOption(fc.anything()),
          fc.func(genOption(fc.anything())),
          fc.func(genOption(fc.anything())),
          (option, arrow1, arrow2) => {
            expect(
              option.flatMap((value1) =>
                arrow1(value1).flatMap((value2) => arrow2(value2)),
              ),
            ).toStrictEqual(
              option
                .flatMap((value1) => arrow1(value1))
                .flatMap((value2) => arrow2(value2)),
            );
          },
        ),
      );
    });
  });

  describe("filter", () => {
    it("should be distributive", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          genOption(fc.anything()),
          fc.func(fc.boolean()),
          fc.func(fc.boolean()),
          (option, predicate1, predicate2) => {
            expect(
              option
                .filter((value) => predicate1(value))
                .filter((value) => predicate2(value)),
            ).toStrictEqual(
              option.filter((value) => predicate1(value) && predicate2(value)),
            );
          },
        ),
      );
    });

    it("should have an identity input", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(genOption(fc.anything()), (option) => {
          expect(option.filter(() => true)).toStrictEqual(option);
        }),
      );
    });

    it("should have an annihilating input", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(genOption(fc.anything()), (option) => {
          expect(option.filter(() => false)).toStrictEqual(None.instance);
        }),
      );
    });
  });

  describe("safeExtract", () => {
    it("should extract the value from Some", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.anything(),
          fc.func(fc.anything()),
          (value, defaultValue) => {
            expect(new Some(value).safeExtract(defaultValue)).toStrictEqual(
              value,
            );
          },
        ),
      );
    });

    it("should return the default value for None", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.func(fc.anything()), (defaultValue) => {
          expect(None.instance.safeExtract(defaultValue)).toStrictEqual(
            defaultValue(),
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
          expect(new Some(value).unsafeExtract(message)).toStrictEqual(value);
        }),
      );
    });

    it("should throw an UnsafeExtractError for None", () => {
      expect.assertions(200);

      fc.assert(
        fc.property(fc.string(), (message) => {
          const error = new UnsafeExtractError(message);
          expect(() => None.instance.unsafeExtract(message)).toThrow(error);
          expect(() => None.instance.unsafeExtract(message)).toThrow(
            UnsafeExtractError,
          );
        }),
      );
    });

    it("should throw the given exception for None", () => {
      expect.assertions(200);

      fc.assert(
        fc.property(fc.string(), (message) => {
          class SomeException extends Exception {}
          const error = new SomeException(message);
          expect(() => None.instance.unsafeExtract(error)).toThrow(error);
          expect(() => None.instance.unsafeExtract(error)).toThrow(
            SomeException,
          );
        }),
      );
    });
  });

  describe("toResult", () => {
    it("should convert Some to Success", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.anything(), fc.func(fc.anything()), (value, error) => {
          expect(new Some(value).toResult(error)).toStrictEqual(
            new Success(value),
          );
        }),
      );
    });

    it("should convert None to Failure", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(genNone, fc.func(fc.anything()), (none, error) => {
          expect(none.toResult(error)).toStrictEqual(new Failure(error()));
        }),
      );
    });
  });

  describe("[Symbol.iterator]", () => {
    it("should iterate over the value of Some", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.anything(), (value) => {
          expect([...new Some(value)]).toStrictEqual([value]);
        }),
      );
    });

    it("should not iterate over None", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(genNone, (none) => {
          expect([...none]).toStrictEqual([]);
        }),
      );
    });
  });
});
