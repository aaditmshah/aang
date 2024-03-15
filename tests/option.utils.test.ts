import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { NoneException } from "../src/exceptions.js";
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

const fromGeneratorThrow = <A>(m: Option<A>, n: Option<A>): void => {
  expect(
    fromGenerator(function* () {
      try {
        const a: A = yield* m.effect();
        return a;
      } catch {
        const a: A = yield* n.effect();
        return a;
      }
    }),
  ).toStrictEqual(m.or(n));
};

const fromGeneratorCatch = <A>(m: Option<A>): void => {
  expect(
    fromGenerator(function* () {
      if (m.isSome) throw new NoneException();
      const a: unknown = yield* m.effect();
      return a;
    }),
  ).toStrictEqual(None.instance);
};

const fromGeneratorRethrow = <A>(m: Option<A>): void => {
  expect(() =>
    fromGenerator(function* () {
      if (m.isSome) throw new Error("fromGeneratorRethrow");

      try {
        const a: unknown = yield* m.effect();
        return a;
      } catch {
        throw new Error("fromGeneratorRethrow");
      }
    }),
  ).toThrow(new Error("fromGeneratorRethrow"));
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

    it("should throw a NoneException when the generator yields None", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          option(fc.anything()),
          fromGeneratorThrow,
        ),
      );
    });

    it("should return None when the generator throws a NoneException", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), fromGeneratorCatch));
    });

    it("should re-throw errors that aren't instances of NoneException", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), fromGeneratorRethrow));
    });
  });
});
