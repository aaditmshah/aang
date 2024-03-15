import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import type { Option } from "../src/option.js";
import { None, Some } from "../src/option.js";
import {
  fromFalsy,
  fromGenerator,
  fromNullable,
  fromValue,
} from "../src/option.utils.js";
import { Fail, Okay } from "../src/result.js";

import { option } from "./arbitraries.js";
import { hotpo, isPowerOfTwo } from "./utils.js";

const fromNullableDefinition = <A>(a: A): void => {
  expect(fromNullable(a)).toStrictEqual(
    a == null ? None.instance : new Some(a),
  );
};

const fromFalsyDefinition = <A>(a: A): void => {
  expect(fromFalsy(a)).toStrictEqual(a ? new Some(a) : None.instance);
};

const fromValueDefinition = <A>(a: A, f: (a: A) => boolean): void => {
  expect(fromValue(a, f)).toStrictEqual(f(a) ? new Some(a) : None.instance);
};

const fromGeneratorEquivalence = <A, B>(
  m: Option<A>,
  p: (a: A) => boolean,
  f: (a: A) => Option<A>,
  g: (a: A) => Option<B>,
): void => {
  expect(
    fromGenerator(function* () {
      let a: A = yield* m.effect();
      while (!p(a)) a = yield* f(a).effect();
      const b: B = yield* g(a).effect();
      return b;
    }),
  ).toStrictEqual(
    m.flatMapUntil((a) => (p(a) ? g(a).map(Okay.of) : f(a).map(Fail.of))),
  );
};

describe("option", () => {
  describe("fromNullable", () => {
    it("should convert any value into a non-nullabe option", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fromNullableDefinition));
    });
  });

  describe("fromFalsy", () => {
    it("should convert any value into a non-falsy option", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fromFalsyDefinition));
    });
  });

  describe("fromValue", () => {
    it("should agree with the predicate", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.anything(), fc.func(fc.boolean()), fromValueDefinition),
      );
    });
  });

  describe("fromGenerator", () => {
    it("should be equivalent to multiple flatMap calls", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.integer({ min: 1 })),
          fc.constant(isPowerOfTwo),
          fc.constant((n: number): Option<number> => new Some(hotpo(n))),
          fc.func(option(fc.anything())),
          fromGeneratorEquivalence,
        ),
      );
    });
  });
});
