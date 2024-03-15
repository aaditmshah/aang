import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { NoneException } from "../src/exceptions.js";
import { id } from "../src/miscellaneous.js";
import type { Option } from "../src/option.js";
import { None, Some } from "../src/option.js";
import { Pair } from "../src/pair.js";
import type { Result } from "../src/result.js";
import { Fail, Okay } from "../src/result.js";

import { none, option, pair, result } from "./arbitraries.js";
import { hotpo, isPowerOfTwo } from "./utils.js";

const toStringSome = <A>(a: A): void => {
  try {
    expect(new Some(a).toString()).toStrictEqual(`Some(${String(a)})`);
  } catch (error) {
    expect(error).toBeInstanceOf(TypeError);
  }
};

const toStringNone = (u: None): void => {
  expect(u.toString()).toStrictEqual("None");
};

const mapIdentity = <A>(u: Option<A>): void => {
  expect(u.map(id)).toStrictEqual(u);
};

const replaceDefinition = <A, B>(u: Option<A>, b: B): void => {
  expect(u.replace(b)).toStrictEqual(u.map(() => b));
};

const andLeftIdentity = <A>(v: Option<A>): void => {
  expect(new Some(undefined).and(v)).toStrictEqual(
    v.map((y) => new Pair(undefined, y)),
  );
};

const andRightIdentity = <A>(u: Option<A>): void => {
  expect(u.and(new Some(undefined))).toStrictEqual(
    u.map((x) => new Pair(x, undefined)),
  );
};

const andAssociativity = <A, B, C>(
  u: Option<A>,
  v: Option<B>,
  w: Option<C>,
): void => {
  expect(u.and(v.and(w)).map((x) => x.associateLeft())).toStrictEqual(
    u.and(v).and(w),
  );
};

const andLeftAnnihilation = <A>(v: Option<A>): void => {
  expect(None.instance.and(v)).toStrictEqual(None.instance);
};

const andRightAnnihilation = <A>(u: Option<A>): void => {
  expect(u.and(None.instance)).toStrictEqual(None.instance);
};

const andThenDefinition = <A, B>(u: Option<A>, v: Option<B>): void => {
  expect(u.andThen(v)).toStrictEqual(u.and(v).map((x) => x.snd));
};

const andWithDefinition = <A, B>(u: Option<A>, v: Option<B>): void => {
  expect(u.andWhen(v)).toStrictEqual(u.and(v).map((x) => x.fst));
};

const orLeftIdentity = <A>(v: Option<A>): void => {
  expect(None.instance.or(v)).toStrictEqual(v);
};

const orRightIdentity = <A>(u: Option<A>): void => {
  expect(u.or(None.instance)).toStrictEqual(u);
};

const orAssociativity = <A>(u: Option<A>, v: Option<A>, w: Option<A>): void => {
  expect(u.or(v.or(w))).toStrictEqual(u.or(v).or(w));
};

const orLeftDistributivity = <A, B>(
  u: Option<A>,
  v: Option<A>,
  w: Option<B>,
): void => {
  expect(u.or(v).and(w)).toStrictEqual(u.and(w).or(v.and(w)));
};

const orRightDistributivity = <A, B>(
  u: Option<A>,
  v: Option<B>,
  w: Option<B>,
): void => {
  expect(u.and(v.or(w))).toStrictEqual(u.and(v).or(u.and(w)));
};

const flatMapLeftIdentity = <A, B>(a: A, k: (a: A) => Option<B>): void => {
  expect(new Some(a).flatMap(k)).toStrictEqual(k(a));
};

const flatMapRightIdentity = <A>(m: Option<A>): void => {
  expect(m.flatMap(Some.of)).toStrictEqual(m);
};

const flatMapAssociativity = <A, B, C>(
  m: Option<A>,
  k: (a: A) => Option<B>,
  h: (b: B) => Option<C>,
): void => {
  expect(m.flatMap((a) => k(a).flatMap(h))).toStrictEqual(
    m.flatMap(k).flatMap(h),
  );
};

const flattenDefinition = <A>(u: Option<Option<A>>): void => {
  expect(u.flatten()).toStrictEqual(u.flatMap(id));
};

const flatMapUntilEquivalence = <A, B>(
  m: Option<A>,
  p: (a: A) => boolean,
  f: (a: A) => Option<A>,
  g: (a: A) => Option<B>,
): void => {
  const step = (a: A): Option<B> => (p(a) ? g(a) : f(a).flatMap(step));
  expect(
    m.flatMapUntil((a) => (p(a) ? g(a).map(Okay.of) : f(a).map(Fail.of))),
  ).toStrictEqual(m.flatMap(step));
};

const filterDistributivity = <A>(
  m: Option<A>,
  p: (a: A) => boolean,
  q: (a: A) => boolean,
): void => {
  expect(m.filter(p).filter(q)).toStrictEqual(m.filter((a) => p(a) && q(a)));
};

const filterIdentity = <A>(m: Option<A>): void => {
  expect(m.filter(() => true)).toStrictEqual(m);
};

const filterAnnihilation = <A>(m: Option<A>): void => {
  expect(m.filter(() => false)).toStrictEqual(None.instance);
};

const isSomeAndDefinition = <A>(m: Option<A>, p: (a: A) => boolean): void => {
  expect(m.isSomeAnd(p)).toStrictEqual(m.filter(p).isSome);
};

const isNoneOrDefinition = <A>(m: Option<A>, p: (a: A) => boolean): void => {
  expect(m.isNoneOr(p)).toStrictEqual(m.filter((a) => !p(a)).isNone);
};

const unzipWithNone = <A, B, C>(f: (a: A) => Pair<B, C>): void => {
  expect(None.instance.unzipWith(f)).toStrictEqual(Pair.of(None.instance));
};

const unzipWithSome = <A, B, C>(a: A, f: (a: A) => Pair<B, C>): void => {
  expect(new Some(a).unzipWith(f)).toStrictEqual(f(a).map(Some.of, Some.of));
};

const unzipDefinition = <A, B>(u: Option<Pair<A, B>>): void => {
  expect(u.unzip()).toStrictEqual(u.unzipWith(id));
};

const transposeMapIdentity = <E, A>(m: Option<Result<E, A>>): void => {
  expect(m.transposeMap(id).transposeMap(id, id)).toStrictEqual(m);
};

const transposeMapOkayIdentity = <E, A>(m: Option<Result<E, A>>): void => {
  expect(m.transposeMapOkay(id).transposeMapOkay(id)).toStrictEqual(m);
};

const transposeMapFailIdentity = <E, A>(m: Option<Result<E, A>>): void => {
  expect(m.transposeMapFail(id).transposeMapFail(id)).toStrictEqual(m);
};

const transposeIdentity = <E, A>(m: Option<Result<E, A>>): void => {
  expect(m.transpose().transpose()).toStrictEqual(m);
};

const transposeOkayIdentity = <E, A>(m: Option<Result<E, A>>): void => {
  expect(m.transposeOkay().transposeOkay()).toStrictEqual(m);
};

const transposeFailIdentity = <E, A>(m: Option<Result<E, A>>): void => {
  expect(m.transposeFail().transposeFail()).toStrictEqual(m);
};

const extractSomeFromSome = <A>(a: A, x: A): void => {
  expect(new Some(a).extractSome(x)).toStrictEqual(a);
};

const extractSomeFromNone = <A>(x: A): void => {
  expect(None.instance.extractSome(x)).toStrictEqual(x);
};

const mapExtractSomeDefinition = <A>(m: Option<A>, a: A): void => {
  expect(m.mapExtractSome(() => a)).toStrictEqual(m.extractSome(a));
};

const toResultOkayIdentity = <E, A>(m: Option<A>, x: E): void => {
  expect(m.toResultOkay(x).toOptionOkay()).toStrictEqual(m);
};

const toResultFailIdentity = <E, A>(m: Option<E>, x: A): void => {
  expect(m.toResultFail(x).toOptionFail()).toStrictEqual(m);
};

const iterateSome = <A>(a: A): void => {
  expect([...new Some(a)]).toStrictEqual([a]);
};

const iterateNone = (m: None): void => {
  expect([...m]).toStrictEqual([]);
};

const effectMapDefinition = <A, B>(m: Option<A>, f: (a: A) => B): void => {
  expect(
    Some.fromGenerator(function* () {
      const b: B = yield* m.effectMap(f);
      return b;
    }),
  ).toStrictEqual(
    Some.fromGenerator(function* () {
      const b: B = f(yield* m.effect());
      return b;
    }),
  );
};

const effectDefinition = <A>(m: Option<A>): void => {
  expect(
    Some.fromGenerator(function* () {
      const a: A = yield* m.effect();
      return a;
    }),
  ).toStrictEqual(
    Some.fromGenerator(function* () {
      const a: A = yield* m.effectMap(id);
      return a;
    }),
  );
};

const fromValidDefinition = <A>(a: A, f: (a: A) => boolean): void => {
  expect(Some.fromValid(a, f)).toStrictEqual(
    f(a) ? new Some(a) : None.instance,
  );
};

const fromGeneratorEquivalence = <A, B>(
  m: Option<A>,
  p: (a: A) => boolean,
  f: (a: A) => Option<A>,
  g: (a: A) => Option<B>,
): void => {
  expect(
    Some.fromGenerator(function* () {
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
    Some.fromGenerator(function* () {
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
    Some.fromGenerator(function* () {
      if (m.isSome) throw new NoneException();
      const a: unknown = yield* m.effect();
      return a;
    }),
  ).toStrictEqual(None.instance);
};

const fromGeneratorRethrow = <A>(m: Option<A>): void => {
  expect(() =>
    Some.fromGenerator(function* () {
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

const fromNullishDefinition = <A>(a: A): void => {
  expect(None.fromNullish(a)).toStrictEqual(
    a == null ? None.instance : new Some(a),
  );
};

const fromFalsyDefinition = <A>(a: A): void => {
  expect(None.fromFalsy(a)).toStrictEqual(a ? new Some(a) : None.instance);
};

describe("Option", () => {
  describe("toString", () => {
    it("should convert Some to a string", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), toStringSome));
    });

    it("should convert None to a string", () => {
      expect.assertions(100);

      fc.assert(fc.property(none, toStringNone));
    });
  });

  describe("map", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), mapIdentity));
    });
  });

  describe("replace", () => {
    it("should agree with map", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(option(fc.anything()), fc.anything(), replaceDefinition),
      );
    });
  });

  describe("and", () => {
    it("should have a left identity", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), andLeftIdentity));
    });

    it("should have a right identity", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), andRightIdentity));
    });

    it("should be associative", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          option(fc.anything()),
          option(fc.anything()),
          andAssociativity,
        ),
      );
    });

    it("should have a left annihilator", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), andLeftAnnihilation));
    });

    it("should have a right annihilator", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), andRightAnnihilation));
    });
  });

  describe("andThen", () => {
    it("should agree with and", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          option(fc.anything()),
          andThenDefinition,
        ),
      );
    });
  });

  describe("andWhen", () => {
    it("should agree with and", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          option(fc.anything()),
          andWithDefinition,
        ),
      );
    });
  });

  describe("or", () => {
    it("should have a left identity", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), orLeftIdentity));
    });

    it("should have a right identity", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), orRightIdentity));
    });

    it("should be associative", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          option(fc.anything()),
          option(fc.anything()),
          orAssociativity,
        ),
      );
    });

    it("should be left distributive", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          option(fc.anything()),
          option(fc.anything()),
          orLeftDistributivity,
        ),
      );
    });

    it("should be right distributive", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          option(fc.anything()),
          option(fc.anything()),
          orRightDistributivity,
        ),
      );
    });
  });

  describe("flatMap", () => {
    it("should have a left identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.anything(),
          fc.func(option(fc.anything())),
          flatMapLeftIdentity,
        ),
      );
    });

    it("should have a right identity", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), flatMapRightIdentity));
    });

    it("should be associative", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          fc.func(option(fc.anything())),
          fc.func(option(fc.anything())),
          flatMapAssociativity,
        ),
      );
    });
  });

  describe("flatten", () => {
    it("should agree with flatMap", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(option(fc.anything())), flattenDefinition));
    });
  });

  describe("flatMapUntil", () => {
    it("should be equivalent to multiple flatMap calls", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.integer({ min: 1 })),
          fc.constant(isPowerOfTwo),
          fc.constant((n: number): Option<number> => new Some(hotpo(n))),
          fc.func(option(fc.anything())),
          flatMapUntilEquivalence,
        ),
      );
    });
  });

  describe("filter", () => {
    it("should be distributive", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          fc.func(fc.boolean()),
          fc.func(fc.boolean()),
          filterDistributivity,
        ),
      );
    });

    it("should have an identity input", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), filterIdentity));
    });

    it("should have an annihilating input", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), filterAnnihilation));
    });
  });

  describe("isSomeAnd", () => {
    it("should agree with filter", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          fc.func(fc.boolean()),
          isSomeAndDefinition,
        ),
      );
    });
  });

  describe("isNoneOr", () => {
    it("should agree with filter", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          fc.func(fc.boolean()),
          isNoneOrDefinition,
        ),
      );
    });
  });

  describe("unzipWith", () => {
    it("should unzip None", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.func(pair(fc.anything(), fc.anything())), unzipWithNone),
      );
    });

    it("should unzip Some", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.anything(),
          fc.func(pair(fc.anything(), fc.anything())),
          unzipWithSome,
        ),
      );
    });
  });

  describe("unzip", () => {
    it("should agree with unzipWith", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(pair(fc.anything(), fc.anything())),
          unzipDefinition,
        ),
      );
    });
  });

  describe("transposeMap", () => {
    it("should commute with Result#transposeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(result(fc.anything(), fc.anything())),
          transposeMapIdentity,
        ),
      );
    });
  });

  describe("transposeMapOkay", () => {
    it("should commute with Result#transposeMapOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(result(fc.anything(), fc.anything())),
          transposeMapOkayIdentity,
        ),
      );
    });
  });

  describe("transposeMapFail", () => {
    it("should commute with Result#transposeMapFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(result(fc.anything(), fc.anything())),
          transposeMapFailIdentity,
        ),
      );
    });
  });

  describe("transpose", () => {
    it("should commute with Result#transpose", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(result(fc.anything(), fc.anything())),
          transposeIdentity,
        ),
      );
    });
  });

  describe("transposeOkay", () => {
    it("should commute with Result#transposeOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(result(fc.anything(), fc.anything())),
          transposeOkayIdentity,
        ),
      );
    });
  });

  describe("transposeFail", () => {
    it("should commute with Result#transposeFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(result(fc.anything(), fc.anything())),
          transposeFailIdentity,
        ),
      );
    });
  });

  describe("extractSome", () => {
    it("should extract the value from Some", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fc.anything(), extractSomeFromSome));
    });

    it("should return the default value for None", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), extractSomeFromNone));
    });
  });

  describe("mapExtractSome", () => {
    it("should agree with extractSome", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          fc.anything(),
          mapExtractSomeDefinition,
        ),
      );
    });
  });

  describe("toResultOkay", () => {
    it("should commute with toOptionOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(option(fc.anything()), fc.anything(), toResultOkayIdentity),
      );
    });
  });

  describe("toResultFail", () => {
    it("should commute with toOptionFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(option(fc.anything()), fc.anything(), toResultFailIdentity),
      );
    });
  });

  describe("[Symbol.iterator]", () => {
    it("should iterate over the value of Some", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), iterateSome));
    });

    it("should not iterate over None", () => {
      expect.assertions(100);

      fc.assert(fc.property(none, iterateNone));
    });
  });

  describe("effectMap", () => {
    it("should agree with effect", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(fc.anything()),
          fc.func(fc.anything()),
          effectMapDefinition,
        ),
      );
    });
  });

  describe("effect", () => {
    it("should agree with effectMap", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), effectDefinition));
    });
  });
});

describe("Some", () => {
  describe("fromValid", () => {
    it("should agree with the predicate", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.anything(), fc.func(fc.boolean()), fromValidDefinition),
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

describe("None", () => {
  describe("fromNullish", () => {
    it("should convert any value into a non-nullish option", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fromNullishDefinition));
    });
  });

  describe("fromFalsy", () => {
    it("should convert any value into a non-falsy option", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fromFalsyDefinition));
    });
  });
});
