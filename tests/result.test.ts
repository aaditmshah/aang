import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { id } from "../src/miscellaneous.js";
import type { Option } from "../src/option.js";
import { Some } from "../src/option.js";
import { Pair } from "../src/pair.js";
import type { Result } from "../src/result.js";
import { Fail, Okay } from "../src/result.js";

import { option, pair, result } from "./arbitraries.js";
import { collatz, hotpo, isPowerOfTwo } from "./utils.js";

const toStringOkay = <A>(a: A): void => {
  try {
    expect(new Okay(a).toString()).toStrictEqual(`Okay(${String(a)})`);
  } catch (error) {
    expect(error).toBeInstanceOf(TypeError);
  }
};

const toStringFail = <E>(x: E): void => {
  try {
    expect(new Fail(x).toString()).toStrictEqual(`Fail(${String(x)})`);
  } catch (error) {
    expect(error).toBeInstanceOf(TypeError);
  }
};

const foldEquivalence = <A, E, T>(
  u: Result<A, E>,
  f: (a: A) => T,
  g: (x: E) => T,
): void => {
  expect(u.fold(f, g)).toStrictEqual(u.isOkay ? f(u.value) : g(u.value));
};

const mapIdentity = <A, E>(u: Result<A, E>): void => {
  expect(u.map(id, id)).toStrictEqual(u);
};

const mapOkayIdentity = <A, E>(u: Result<A, E>): void => {
  expect(u.mapOkay(id)).toStrictEqual(u);
};

const mapFailIdentity = <A, E>(u: Result<A, E>): void => {
  expect(u.mapFail(id)).toStrictEqual(u);
};

const replaceDefinition = <A, B, E, F>(u: Result<A, E>, b: B, f: F): void => {
  expect(u.replace(b, f)).toStrictEqual(
    u.map(
      () => b,
      () => f,
    ),
  );
};

const replaceOkayDefinition = <A, B, E>(u: Result<A, E>, b: B): void => {
  expect(u.replaceOkay(b)).toStrictEqual(u.mapOkay(() => b));
};

const replaceFailDefinition = <A, E, F>(u: Result<A, E>, f: F): void => {
  expect(u.replaceFail(f)).toStrictEqual(u.mapFail(() => f));
};

const andLeftIdentity = <A, E>(v: Result<A, E>): void => {
  expect(new Okay(undefined).and(v)).toStrictEqual(
    v.mapOkay((y) => new Pair(undefined, y)),
  );
};

const andRightIdentity = <A, E>(u: Result<A, E>): void => {
  expect(u.and(new Okay(undefined))).toStrictEqual(
    u.mapOkay((x) => new Pair(x, undefined)),
  );
};

const andAssociativity = <A, B, C, E>(
  u: Result<A, E>,
  v: Result<B, E>,
  w: Result<C, E>,
): void => {
  expect(u.and(v.and(w)).mapOkay((x) => x.associateLeft())).toStrictEqual(
    u.and(v).and(w),
  );
};

const andLeftAnnihilation = <A, E>(v: Result<A, E>): void => {
  expect(new Fail(undefined).and(v)).toStrictEqual(new Fail(undefined));
};

const andThenDefinition = <A, B, E>(u: Result<A, E>, v: Result<B, E>): void => {
  expect(u.andThen(v)).toStrictEqual(u.and(v).mapOkay((x) => x.snd));
};

const andWhenDefinition = <A, B, E>(u: Result<A, E>, v: Result<B, E>): void => {
  expect(u.andWhen(v)).toStrictEqual(u.and(v).mapOkay((x) => x.fst));
};

const orLeftIdentity = <A, E>(v: Result<A, E>): void => {
  expect(new Fail(undefined).or(v)).toStrictEqual(
    v.mapFail((y) => new Pair(undefined, y)),
  );
};

const orRightIdentity = <A, E>(u: Result<A, E>): void => {
  expect(u.or(new Fail(undefined))).toStrictEqual(
    u.mapFail((x) => new Pair(x, undefined)),
  );
};

const orAssociativity = <A, E, F, G>(
  u: Result<A, E>,
  v: Result<A, F>,
  w: Result<A, G>,
): void => {
  expect(u.or(v.or(w)).mapFail((x) => x.associateLeft())).toStrictEqual(
    u.or(v).or(w),
  );
};

const orLeftAnnihilation = <A, E>(v: Result<A, E>): void => {
  expect(new Okay(undefined).or(v)).toStrictEqual(new Okay(undefined));
};

const orElseDefinition = <A, E, F>(u: Result<A, E>, v: Result<A, F>): void => {
  expect(u.orElse(v)).toStrictEqual(u.or(v).mapFail((x) => x.snd));
};

const orErstDefinition = <A, E, F>(u: Result<A, E>, v: Result<A, F>): void => {
  expect(u.orErst(v)).toStrictEqual(u.or(v).mapFail((x) => x.fst));
};

const flatMapLeftIdentityOkay = <A, B, E>(
  a: A,
  k: (a: A) => Result<B, E>,
): void => {
  expect(new Okay(a).flatMap<A, B, E, E>(k, Fail.of)).toStrictEqual(k(a));
};

const flatMapLeftIdentityFail = <A, E, F>(
  x: E,
  k: (x: E) => Result<A, F>,
): void => {
  expect(new Fail(x).flatMap<A, A, E, F>(Okay.of, k)).toStrictEqual(k(x));
};

const flatMapRightIdentity = <A, E>(m: Result<A, E>): void => {
  expect(m.flatMap(Okay.of, Fail.of)).toStrictEqual(m);
};

const flatMapAssociativity = <A, B, C, E, F, G>(
  m: Result<A, E>,
  k: (a: A) => Result<B, F>,
  c: (x: E) => Result<B, F>,
  h: (b: B) => Result<C, G>,
  g: (f: F) => Result<C, G>,
): void => {
  expect(
    m.flatMap(
      (a) => k(a).flatMap(h, g),
      (x) => c(x).flatMap(h, g),
    ),
  ).toStrictEqual(m.flatMap(k, c).flatMap(h, g));
};

const flatMapOkayDefinition = <A, B, E>(
  m: Result<A, E>,
  k: (a: A) => Result<B, E>,
): void => {
  expect(m.flatMapOkay(k)).toStrictEqual(m.flatMap(k, Fail.of));
};

const flatMapFailDefnition = <A, E, F>(
  m: Result<A, E>,
  k: (x: E) => Result<A, F>,
): void => {
  expect(m.flatMapFail(k)).toStrictEqual(m.flatMap(Okay.of, k));
};

const flattenOkayDefinition = <A, E>(m: Result<Result<A, E>, E>): void => {
  expect(m.flattenOkay()).toStrictEqual(m.flatMapOkay(id));
};

const flattenFailDefinition = <A, E>(m: Result<A, Result<A, E>>): void => {
  expect(m.flattenFail()).toStrictEqual(m.flatMapFail(id));
};

const flatMapUntilEquivalence = <A, B, E, F>(
  m: Result<A, E>,
  k: (a: A) => Result<Result<B, A>, Result<F, E>>,
  c: (x: E) => Result<Result<B, A>, Result<F, E>>,
): void => {
  const f = (x: Result<B, A>): Result<B, F> =>
    x.isOkay ? x : k(x.value).flatMap(f, g);
  const g = (y: Result<F, E>): Result<B, F> =>
    y.isOkay ? new Fail(y.value) : c(y.value).flatMap(f, g);
  expect(m.flatMapUntil(k, c)).toStrictEqual(m.flatMap(k, c).flatMap(f, g));
};

const flatMapOkayUntilEquivalence = <A, B, E>(
  m: Result<A, E>,
  k: (a: A) => Result<Result<B, A>, E>,
): void => {
  const f = (x: Result<B, A>): Result<B, E> =>
    x.isOkay ? x : k(x.value).flatMapOkay(f);
  expect(m.flatMapOkayUntil(k)).toStrictEqual(m.flatMapOkay(k).flatMapOkay(f));
};

const flatMapFailUntilEquivalence = <A, E, F>(
  m: Result<A, E>,
  c: (x: E) => Result<A, Result<F, E>>,
): void => {
  const g = (y: Result<F, E>): Result<A, F> =>
    y.isOkay ? new Fail(y.value) : c(y.value).flatMapFail(g);
  expect(m.flatMapFailUntil(c)).toStrictEqual(m.flatMapFail(c).flatMapFail(g));
};

const commuteInverse = <A, E>(m: Result<A, E>): void => {
  expect(m.commute().commute()).toStrictEqual(m);
};

const isOkayAndDefinition = <A, E>(
  m: Result<A, E>,
  p: (a: A) => boolean,
): void => {
  expect(m.isOkayAnd(p)).toStrictEqual(m.toOptionOkay().isSomeAnd(p));
};

const isFailAndDefinition = <A, E>(
  m: Result<A, E>,
  p: (x: E) => boolean,
): void => {
  expect(m.isFailAnd(p)).toStrictEqual(m.toOptionFail().isSomeAnd(p));
};

const isOkayOrDefinition = <A, E>(
  m: Result<A, E>,
  p: (x: E) => boolean,
): void => {
  expect(m.isOkayOr(p)).toStrictEqual(m.toOptionFail().isNoneOr(p));
};

const isFailOrDefinition = <A, E>(
  m: Result<A, E>,
  p: (a: A) => boolean,
): void => {
  expect(m.isFailOr(p)).toStrictEqual(m.toOptionOkay().isNoneOr(p));
};

const transposeMapOkayDefinition = <A, B, E>(
  m: Result<A, E>,
  f: (a: A) => Option<B>,
): void => {
  expect(m.transposeMapOkay(f)).toStrictEqual(m.transposeMap(f, Some.of));
};

const transposeMapFailDefinition = <A, E, F>(
  m: Result<A, E>,
  g: (x: E) => Option<F>,
): void => {
  expect(m.transposeMapFail(g)).toStrictEqual(m.transposeMap(Some.of, g));
};

const transposeDefinition = <A, E>(m: Result<Option<A>, Option<E>>): void => {
  expect(m.transpose()).toStrictEqual(m.transposeMap(id, id));
};

const transposeOkayDefinition = <A, E>(m: Result<Option<A>, E>): void => {
  expect(m.transposeOkay()).toStrictEqual(m.transposeMap(id, Some.of));
};

const transposeFailDefinition = <A, E>(m: Result<A, Option<E>>): void => {
  expect(m.transposeFail()).toStrictEqual(m.transposeMap(Some.of, id));
};

const unzipWithOkayDefinition = <A, B, C, E>(
  m: Result<A, E>,
  f: (a: A) => Pair<B, C>,
): void => {
  expect(m.unzipWithOkay(f)).toStrictEqual(m.unzipWith(f, Pair.from));
};

const unzipWithFailDefinition = <A, E, F, G>(
  m: Result<A, E>,
  g: (x: E) => Pair<F, G>,
): void => {
  expect(m.unzipWithFail(g)).toStrictEqual(m.unzipWith(Pair.from, g));
};

const unzipDefinition = <A, B, E, F>(
  m: Result<Pair<A, B>, Pair<E, F>>,
): void => {
  expect(m.unzip()).toStrictEqual(m.unzipWith(id, id));
};

const unzipOkayDefinition = <A, B, E>(m: Result<Pair<A, B>, E>): void => {
  expect(m.unzipOkay()).toStrictEqual(m.unzipWith(id, Pair.from));
};

const unzipFailDefinition = <A, E, F>(m: Result<A, Pair<E, F>>): void => {
  expect(m.unzipFail()).toStrictEqual(m.unzipWith(Pair.from, id));
};

const collectFstDefinition = <A, B, C>(
  m: Result<Pair<A, C>, Pair<B, C>>,
): void => {
  expect(m.collectFst()).toStrictEqual(m.collectMapFst(id, id));
};

const collectSndDefinition = <A, B, C>(
  m: Result<Pair<A, B>, Pair<A, C>>,
): void => {
  expect(m.collectSnd()).toStrictEqual(m.collectMapSnd(id, id));
};

const exchangeMapFailDefinition = <A, B, E, F>(
  m: Result<A, E>,
  f: (a: A) => Result<B, F>,
): void => {
  expect(m.exchangeMapFail(f)).toStrictEqual(m.collectMapOkay(f, Okay.of));
};

const associateMapLeftDefinition = <Y, A, B, C>(
  m: Result<A, Y>,
  g: (x: Y) => Result<B, C>,
): void => {
  expect(m.associateMapLeft(g)).toStrictEqual(m.collectMapOkay(Okay.of, g));
};

const collectOkayDefinition = <A, B, E>(
  m: Result<Result<A, E>, Result<B, E>>,
): void => {
  expect(m.collectOkay()).toStrictEqual(m.collectMapOkay(id, id));
};

const exchangeFailDefinition = <A, E, F>(m: Result<Result<A, E>, F>): void => {
  expect(m.exchangeFail()).toStrictEqual(m.collectMapOkay(id, Okay.of));
};

const exchangeFailInverse = <A, E, F>(m: Result<Result<A, E>, F>): void => {
  expect(m.exchangeFail().exchangeFail()).toStrictEqual(m);
};

const associateLeftDefinition = <A, B, C>(m: Result<A, Result<B, C>>): void => {
  expect(m.associateLeft()).toStrictEqual(m.collectMapOkay(Okay.of, id));
};

const associateLeftInverse = <A, B, C>(m: Result<Result<A, B>, C>): void => {
  expect(m.associateRight().associateLeft()).toStrictEqual(m);
};

const exchangeMapOkayDefinition = <A, B, E, F>(
  m: Result<A, E>,
  g: (x: E) => Result<B, F>,
): void => {
  expect(m.exchangeMapOkay(g)).toStrictEqual(m.collectMapFail(Fail.of, g));
};

const associateMapRightDefinition = <X, A, B, C>(
  m: Result<X, C>,
  f: (x: X) => Result<A, B>,
): void => {
  expect(m.associateMapRight(f)).toStrictEqual(m.collectMapFail(f, Fail.of));
};

const collectFailDefinition = <A, E, F>(
  m: Result<Result<A, E>, Result<A, F>>,
): void => {
  expect(m.collectFail()).toStrictEqual(m.collectMapFail(id, id));
};

const exchangeOkayDefinition = <A, B, E>(m: Result<A, Result<B, E>>): void => {
  expect(m.exchangeOkay()).toStrictEqual(m.collectMapFail(Fail.of, id));
};

const exchangeOkayInverse = <A, B, E>(m: Result<A, Result<B, E>>): void => {
  expect(m.exchangeOkay().exchangeOkay()).toStrictEqual(m);
};

const associateRightDefinition = <A, B, C>(
  m: Result<Result<A, B>, C>,
): void => {
  expect(m.associateRight()).toStrictEqual(m.collectMapFail(id, Fail.of));
};

const associateRightInverse = <A, B, C>(m: Result<A, Result<B, C>>): void => {
  expect(m.associateLeft().associateRight()).toStrictEqual(m);
};

const distributeMapDefinition = <A, B, E, F>(
  m: Result<Result<A, B>, Result<E, F>>,
): void => {
  expect(m.distributeMap(id, id)).toStrictEqual(m.distribute());
};

const distributeInverse = <A, B, E, F>(
  m: Result<Result<A, B>, Result<E, F>>,
): void => {
  expect(m.distribute().distribute()).toStrictEqual(m);
};

const extractOkayFromOkay = <A>(a: A, x: A): void => {
  expect(new Okay(a).extractOkay(x)).toStrictEqual(a);
};

const extractOkayFromFail = <A, E>(x: E, y: A): void => {
  expect(new Fail(x).extractOkay(y)).toStrictEqual(y);
};

const extractFailFromFail = <E>(x: E, y: E): void => {
  expect(new Fail(x).extractFail(y)).toStrictEqual(x);
};

const extractFailFromOkay = <A, E>(a: A, x: E): void => {
  expect(new Okay(a).extractFail(x)).toStrictEqual(x);
};

const extractMapOkayDefinition = <A, E>(m: Result<A, E>, a: A): void => {
  expect(m.extractMapOkay(() => a)).toStrictEqual(m.extractOkay(a));
};

const extractMapFailDefinition = <A, E>(m: Result<A, E>, x: E): void => {
  expect(m.extractMapFail(() => x)).toStrictEqual(m.extractFail(x));
};

const valuesDefinition = <A, E>(m: Result<A, E>): void => {
  expect([...m.values()]).toStrictEqual([...m.okayValues(), ...m.failValues()]);
};

const effectMapDefinition = <A, B, E>(
  m: Result<A, E>,
  f: (a: A) => B,
): void => {
  expect(
    Okay.fromGenerator(function* () {
      const b: B = yield* m.effectMap(f);
      return b;
    }),
  ).toStrictEqual(
    Okay.fromGenerator(function* () {
      const b: B = f(yield* m.effect());
      return b;
    }),
  );
};

const fromGeneratorEquivalence = <A, B, E>(
  m: Result<A, E>,
  p: (a: A) => boolean,
  f: (a: A) => Result<A, E>,
  g: (a: A) => Result<B, E>,
): void => {
  expect(
    Okay.fromGenerator(function* () {
      let a: A = yield* m.effect();
      while (!p(a)) a = yield* f(a).effect();
      const b: B = yield* g(a).effect();
      return b;
    }),
  ).toStrictEqual(
    m.flatMapOkayUntil((a) =>
      p(a) ? g(a).mapOkay(Okay.of) : f(a).mapOkay(Fail.of),
    ),
  );
};

const fromGeneratorThrow = <A, E>(m: Result<A, E>, n: Result<A, E>): void => {
  expect(
    Okay.fromGenerator(function* () {
      try {
        const a: A = yield* m.effect();
        return a;
      } catch {
        const a: A = yield* n.effect();
        return a;
      }
    }),
  ).toStrictEqual(m.orElse(n));
};

const fromGeneratorCatch = <A, E>(m: Result<A, E>, x: E): void => {
  expect(
    Okay.fromGenerator(function* () {
      if (m.isOkay) throw x;
      const a: A = yield* m.effect<A, E>();
      return a;
    }),
  ).toStrictEqual(m.isOkay ? new Fail(x) : m);
};

describe("Result", () => {
  describe("toString", () => {
    it("should convert Okay to a string", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), toStringOkay));
    });

    it("should convert Fail to a string", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), toStringFail));
    });
  });

  describe("fold", () => {
    it("should fold the Result", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(fc.anything()),
          fc.func(fc.anything()),
          foldEquivalence,
        ),
      );
    });
  });

  describe("map", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(fc.property(result(fc.anything(), fc.anything()), mapIdentity));
    });
  });

  describe("mapOkay", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), mapOkayIdentity),
      );
    });
  });

  describe("mapFail", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), mapFailIdentity),
      );
    });
  });

  describe("replace", () => {
    it("should agree with map", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.anything(),
          fc.anything(),
          replaceDefinition,
        ),
      );
    });
  });

  describe("replaceOkay", () => {
    it("should agree with mapOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.anything(),
          replaceOkayDefinition,
        ),
      );
    });
  });

  describe("replaceFail", () => {
    it("should agree with mapFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.anything(),
          replaceFailDefinition,
        ),
      );
    });
  });

  describe("and", () => {
    it("should have a left identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), andLeftIdentity),
      );
    });

    it("should have a right identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), andRightIdentity),
      );
    });

    it("should be associative", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          result(fc.anything(), fc.anything()),
          result(fc.anything(), fc.anything()),
          andAssociativity,
        ),
      );
    });

    it("should have a left annihilator", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), andLeftAnnihilation),
      );
    });
  });

  describe("andThen", () => {
    it("should agree with and", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          result(fc.anything(), fc.anything()),
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
          result(fc.anything(), fc.anything()),
          result(fc.anything(), fc.anything()),
          andWhenDefinition,
        ),
      );
    });
  });

  describe("or", () => {
    it("should have a left identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), orLeftIdentity),
      );
    });

    it("should have a right identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), orRightIdentity),
      );
    });

    it("should be associative", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          result(fc.anything(), fc.anything()),
          result(fc.anything(), fc.anything()),
          orAssociativity,
        ),
      );
    });

    it("should have a left annihilator", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), orLeftAnnihilation),
      );
    });
  });

  describe("orElse", () => {
    it("should agree with or", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          result(fc.anything(), fc.anything()),
          orElseDefinition,
        ),
      );
    });
  });

  describe("orErst", () => {
    it("should agree with or", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          result(fc.anything(), fc.anything()),
          orErstDefinition,
        ),
      );
    });
  });

  describe("flatMap", () => {
    it("should have a left okay identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.anything(),
          fc.func(result(fc.anything(), fc.anything())),
          flatMapLeftIdentityOkay,
        ),
      );
    });

    it("should have a left fail identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.anything(),
          fc.func(result(fc.anything(), fc.anything())),
          flatMapLeftIdentityFail,
        ),
      );
    });

    it("should have a right okay and a right fail identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), flatMapRightIdentity),
      );
    });

    it("should be associative", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          fc.func(result(fc.anything(), fc.anything())),
          fc.func(result(fc.anything(), fc.anything())),
          fc.func(result(fc.anything(), fc.anything())),
          flatMapAssociativity,
        ),
      );
    });
  });

  describe("flatMapOkay", () => {
    it("should agree with flatMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          flatMapOkayDefinition,
        ),
      );
    });
  });

  describe("flatMapFail", () => {
    it("should agree with flatMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          flatMapFailDefnition,
        ),
      );
    });
  });

  describe("flattenOkay", () => {
    it("should agree with flatMapOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(result(fc.anything(), fc.anything()), fc.anything()),
          flattenOkayDefinition,
        ),
      );
    });
  });

  describe("flattenFail", () => {
    it("should agree with flatMapFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), result(fc.anything(), fc.anything())),
          flattenFailDefinition,
        ),
      );
    });
  });

  describe("flatMapUntil", () => {
    it("should be equivalent to multiple flatMap calls", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.integer({ min: 1 }), fc.integer({ min: 1 })),
          fc.constant((n: number) => new Okay(collatz(n))),
          fc.constant((n: number) => new Fail(collatz(n))),
          flatMapUntilEquivalence,
        ),
      );
    });
  });

  describe("flatMapOkayUntil", () => {
    it("should be equivalent to multiple flatMapOkay calls", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.integer({ min: 1 }), fc.anything()),
          fc.constant((n: number) => new Okay(collatz(n))),
          flatMapOkayUntilEquivalence,
        ),
      );
    });
  });

  describe("flatMapFailUntil", () => {
    it("should be equivalent to multiple flatMapFail calls", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.integer({ min: 1 })),
          fc.constant((n: number) => new Fail(collatz(n))),
          flatMapFailUntilEquivalence,
        ),
      );
    });
  });

  describe("commute", () => {
    it("should be its own inverse", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), commuteInverse),
      );
    });
  });

  describe("isOkayAnd", () => {
    it("should agree with isSomeAnd", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(fc.boolean()),
          isOkayAndDefinition,
        ),
      );
    });
  });

  describe("isFailAnd", () => {
    it("should agree with isSomeAnd", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(fc.boolean()),
          isFailAndDefinition,
        ),
      );
    });
  });

  describe("isOkayOr", () => {
    it("should agree with isNoneOr", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(fc.boolean()),
          isOkayOrDefinition,
        ),
      );
    });
  });

  describe("isFailOr", () => {
    it("should agree with isNoneOr", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(fc.boolean()),
          isFailOrDefinition,
        ),
      );
    });
  });

  describe("transposeMapOkay", () => {
    it("should agree with transposeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(option(fc.anything())),
          transposeMapOkayDefinition,
        ),
      );
    });
  });

  describe("transposeMapFail", () => {
    it("should agree with transposeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(option(fc.anything())),
          transposeMapFailDefinition,
        ),
      );
    });
  });

  describe("transpose", () => {
    it("should agree with transposeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(option(fc.anything()), option(fc.anything())),
          transposeDefinition,
        ),
      );
    });
  });

  describe("transposeOkay", () => {
    it("should agree with transposeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(option(fc.anything()), fc.anything()),
          transposeOkayDefinition,
        ),
      );
    });
  });

  describe("transposeFail", () => {
    it("should agree with transposeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), option(fc.anything())),
          transposeFailDefinition,
        ),
      );
    });
  });

  describe("unzipWithOkay", () => {
    it("should agree with unzipWith", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(pair(fc.anything(), fc.anything())),
          unzipWithOkayDefinition,
        ),
      );
    });
  });

  describe("unzipWithFail", () => {
    it("should agree with unzipWith", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(pair(fc.anything(), fc.anything())),
          unzipWithFailDefinition,
        ),
      );
    });
  });

  describe("unzip", () => {
    it("should agree with unzipWith", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(
            pair(fc.anything(), fc.anything()),
            pair(fc.anything(), fc.anything()),
          ),
          unzipDefinition,
        ),
      );
    });
  });

  describe("unzipOkay", () => {
    it("should agree with unzipWith", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(pair(fc.anything(), fc.anything()), fc.anything()),
          unzipOkayDefinition,
        ),
      );
    });
  });

  describe("unzipFail", () => {
    it("should agree with unzipWith", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), pair(fc.anything(), fc.anything())),
          unzipFailDefinition,
        ),
      );
    });
  });

  describe("collectFst", () => {
    it("should agree with collectMapFst", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(
            pair(fc.anything(), fc.anything()),
            pair(fc.anything(), fc.anything()),
          ),
          collectFstDefinition,
        ),
      );
    });
  });

  describe("collectSnd", () => {
    it("should agree with collectMapSnd", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(
            pair(fc.anything(), fc.anything()),
            pair(fc.anything(), fc.anything()),
          ),
          collectSndDefinition,
        ),
      );
    });
  });

  describe("exchangeMapFail", () => {
    it("should agree with collectMapOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          exchangeMapFailDefinition,
        ),
      );
    });
  });

  describe("associateMapLeft", () => {
    it("should agree with collectMapOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          associateMapLeftDefinition,
        ),
      );
    });
  });

  describe("collectOkay", () => {
    it("should agree with collectMapOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(
            result(fc.anything(), fc.anything()),
            result(fc.anything(), fc.anything()),
          ),
          collectOkayDefinition,
        ),
      );
    });
  });

  describe("exchangeFail", () => {
    it("should agree with collectMapOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(result(fc.anything(), fc.anything()), fc.anything()),
          exchangeFailDefinition,
        ),
      );
    });

    it("should be its own inverse", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(result(fc.anything(), fc.anything()), fc.anything()),
          exchangeFailInverse,
        ),
      );
    });
  });

  describe("associateLeft", () => {
    it("should agree with collectMapOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), result(fc.anything(), fc.anything())),
          associateLeftDefinition,
        ),
      );
    });

    it("should be the inverse of associateRight", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(result(fc.anything(), fc.anything()), fc.anything()),
          associateLeftInverse,
        ),
      );
    });
  });

  describe("exchangeMapOkay", () => {
    it("should agree with collectMapFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          exchangeMapOkayDefinition,
        ),
      );
    });
  });

  describe("associateMapRight", () => {
    it("should agree with collectMapFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          associateMapRightDefinition,
        ),
      );
    });
  });

  describe("collectFail", () => {
    it("should agree with collectMapFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(
            result(fc.anything(), fc.anything()),
            result(fc.anything(), fc.anything()),
          ),
          collectFailDefinition,
        ),
      );
    });
  });

  describe("exchangeOkay", () => {
    it("should agree with collectMapFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), result(fc.anything(), fc.anything())),
          exchangeOkayDefinition,
        ),
      );
    });

    it("should be its own inverse", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), result(fc.anything(), fc.anything())),
          exchangeOkayInverse,
        ),
      );
    });
  });

  describe("associateRight", () => {
    it("should agree with collectMapFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(result(fc.anything(), fc.anything()), fc.anything()),
          associateRightDefinition,
        ),
      );
    });

    it("should be the inverse of associateLeft", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), result(fc.anything(), fc.anything())),
          associateRightInverse,
        ),
      );
    });
  });

  describe("distributeMap", () => {
    it("should agree with distribute", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(
            result(fc.anything(), fc.anything()),
            result(fc.anything(), fc.anything()),
          ),
          distributeMapDefinition,
        ),
      );
    });
  });

  describe("distribute", () => {
    it("should be its own inverse", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(
            result(fc.anything(), fc.anything()),
            result(fc.anything(), fc.anything()),
          ),
          distributeInverse,
        ),
      );
    });
  });

  describe("extractOkay", () => {
    it("should extract the value from Okay", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fc.anything(), extractOkayFromOkay));
    });

    it("should return the default value for Fail", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fc.anything(), extractOkayFromFail));
    });
  });

  describe("extractFail", () => {
    it("should extract the value from Fail", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fc.anything(), extractFailFromFail));
    });

    it("should return the default value for Okay", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fc.anything(), extractFailFromOkay));
    });
  });

  describe("extractMapOkay", () => {
    it("should agree with extractOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.anything(),
          extractMapOkayDefinition,
        ),
      );
    });
  });

  describe("extractMapFail", () => {
    it("should agree with extractFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.anything(),
          extractMapFailDefinition,
        ),
      );
    });
  });

  describe("values", () => {
    it("should agree with okayValues and failValues", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), valuesDefinition),
      );
    });
  });

  describe("effectMap", () => {
    it("should agree with effect", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.func(fc.anything()),
          effectMapDefinition,
        ),
      );
    });
  });
});

describe("Okay", () => {
  describe("fromGenerator", () => {
    it("should be equivalent to multiple flatMap calls", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.integer({ min: 1 }), fc.anything()),
          fc.constant(isPowerOfTwo),
          fc.constant((n: number) => new Okay(hotpo(n))),
          fc.func(result(fc.anything(), fc.anything())),
          fromGeneratorEquivalence,
        ),
      );
    });

    it("should throw the value when the generator yields Fail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          result(fc.anything(), fc.anything()),
          fromGeneratorThrow,
        ),
      );
    });

    it("should return Fail when the generator throws an Exception", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(fc.anything(), fc.anything()),
          fc.anything(),
          fromGeneratorCatch,
        ),
      );
    });
  });
});
