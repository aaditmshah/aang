import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import type { Failure, Result, Success } from "../src/result.js";
import { failure, success } from "../src/result.js";

const id = <A>(value: A): A => value;

const genSuccess = <A>(genValue: fc.Arbitrary<A>): fc.Arbitrary<Success<A>> =>
  genValue.map((value) => success(value));

const genFailure = <E>(genError: fc.Arbitrary<E>): fc.Arbitrary<Failure<E>> =>
  genError.map((error) => failure(error));

const genResult = <E, A>(
  genValue: fc.Arbitrary<A>,
  genError: fc.Arbitrary<E>,
): fc.Arbitrary<Result<E, A>> =>
  fc.oneof(genSuccess(genValue), genFailure(genError));

describe("Result", () => {
  describe("map", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(genResult(fc.anything(), fc.anything()), (result) => {
          expect(result.map((value) => id(value))).toStrictEqual(result);
        }),
      );
    });
  });
});
