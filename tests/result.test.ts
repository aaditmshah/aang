import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { id } from "../src/miscellaneous.js";
import { Pair } from "../src/pair.js";
import type { Result } from "../src/result.js";
import { Fail, Okay } from "../src/result.js";

import { result } from "./arbitraries.js";
import { collatz } from "./utils.js";

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

const mapIdentity = <E, A>(u: Result<E, A>): void => {
  expect(u.map(id, id)).toStrictEqual(u);
};

const mapOkayIdentity = <E, A>(u: Result<E, A>): void => {
  expect(u.mapOkay(id)).toStrictEqual(u);
};

const mapFailIdentity = <E, A>(u: Result<E, A>): void => {
  expect(u.mapFail(id)).toStrictEqual(u);
};

const replaceDefinition = <E, F, A, B>(u: Result<E, A>, f: F, b: B): void => {
  expect(u.replace(f, b)).toStrictEqual(
    u.map(
      () => f,
      () => b,
    ),
  );
};

const replaceOkayDefinition = <E, A, B>(u: Result<E, A>, b: B): void => {
  expect(u.replaceOkay(b)).toStrictEqual(u.mapOkay(() => b));
};

const replaceFailDefinition = <E, F, A>(u: Result<E, A>, f: F): void => {
  expect(u.replaceFail(f)).toStrictEqual(u.mapFail(() => f));
};

const andLeftIdentity = <E, A>(v: Result<E, A>): void => {
  expect(new Okay(undefined).and(v)).toStrictEqual(
    v.mapOkay((y) => new Pair(undefined, y)),
  );
};

const andRightIdentity = <E, A>(u: Result<E, A>): void => {
  expect(u.and(new Okay(undefined))).toStrictEqual(
    u.mapOkay((x) => new Pair(x, undefined)),
  );
};

const andAssociativity = <E, A, B, C>(
  u: Result<E, A>,
  v: Result<E, B>,
  w: Result<E, C>,
): void => {
  expect(u.and(v.and(w)).mapOkay((x) => x.associateLeft())).toStrictEqual(
    u.and(v).and(w),
  );
};

const andLeftAnnihilation = <E, A>(v: Result<E, A>): void => {
  expect(new Fail(undefined).and(v)).toStrictEqual(new Fail(undefined));
};

const andThenDefinition = <E, A, B>(u: Result<E, A>, v: Result<E, B>): void => {
  expect(u.andThen(v)).toStrictEqual(u.and(v).mapOkay((x) => x.snd));
};

const andWhenDefinition = <E, A, B>(u: Result<E, A>, v: Result<E, B>): void => {
  expect(u.andWhen(v)).toStrictEqual(u.and(v).mapOkay((x) => x.fst));
};

const orLeftIdentity = <E, A>(v: Result<E, A>): void => {
  expect(new Fail(undefined).or(v)).toStrictEqual(
    v.mapFail((y) => new Pair(undefined, y)),
  );
};

const orRightIdentity = <E, A>(u: Result<E, A>): void => {
  expect(u.or(new Fail(undefined))).toStrictEqual(
    u.mapFail((x) => new Pair(x, undefined)),
  );
};

const orAssociativity = <E, F, G, A>(
  u: Result<E, A>,
  v: Result<F, A>,
  w: Result<G, A>,
): void => {
  expect(u.or(v.or(w)).mapFail((x) => x.associateLeft())).toStrictEqual(
    u.or(v).or(w),
  );
};

const orLeftAnnihilation = <E, A>(v: Result<E, A>): void => {
  expect(new Okay(undefined).or(v)).toStrictEqual(new Okay(undefined));
};

const orElseDefinition = <E, F, A>(u: Result<E, A>, v: Result<F, A>): void => {
  expect(u.orElse(v)).toStrictEqual(u.or(v).mapFail((x) => x.snd));
};

const orErstDefinition = <E, F, A>(u: Result<E, A>, v: Result<F, A>): void => {
  expect(u.orErst(v)).toStrictEqual(u.or(v).mapFail((x) => x.fst));
};

const flatMapLeftIdentityOkay = <E, A, B>(
  a: A,
  k: (a: A) => Result<E, B>,
): void => {
  expect(new Okay(a).flatMap<E, E, A, B>(k, Fail.of)).toStrictEqual(k(a));
};

const flatMapLeftIdentityFail = <E, F, A>(
  x: E,
  k: (x: E) => Result<F, A>,
): void => {
  expect(new Fail(x).flatMap<E, F, A, A>(Okay.of, k)).toStrictEqual(k(x));
};

const flatMapRightIdentity = <E, A>(m: Result<E, A>): void => {
  expect(m.flatMap(Okay.of, Fail.of)).toStrictEqual(m);
};

const flatMapAssociativity = <E, F, G, A, B, C>(
  m: Result<E, A>,
  k: (a: A) => Result<F, B>,
  c: (x: E) => Result<F, B>,
  h: (b: B) => Result<G, C>,
  g: (f: F) => Result<G, C>,
): void => {
  expect(
    m.flatMap(
      (a) => k(a).flatMap(h, g),
      (x) => c(x).flatMap(h, g),
    ),
  ).toStrictEqual(m.flatMap(k, c).flatMap(h, g));
};

const flatMapOkayDefinition = <E, A, B>(
  m: Result<E, A>,
  k: (a: A) => Result<E, B>,
): void => {
  expect(m.flatMapOkay(k)).toStrictEqual(m.flatMap(k, Fail.of));
};

const flatMapFailDefnition = <E, F, A>(
  m: Result<E, A>,
  k: (x: E) => Result<F, A>,
): void => {
  expect(m.flatMapFail(k)).toStrictEqual(m.flatMap(Okay.of, k));
};

const flattenDefinition = <E, A>(
  m: Result<Result<E, A>, Result<E, A>>,
): void => {
  expect(m.flatten()).toStrictEqual(m.flatMap(id, id));
};

const flattenOkayDefinition = <E, A>(m: Result<E, Result<E, A>>): void => {
  expect(m.flattenOkay()).toStrictEqual(m.flatMapOkay(id));
};

const flattenFailDefinition = <E, A>(m: Result<Result<E, A>, A>): void => {
  expect(m.flattenFail()).toStrictEqual(m.flatMapFail(id));
};

const flatMapUntilEquivalence = <E, F, A, B>(
  m: Result<E, A>,
  k: (a: A) => Result<Result<E, F>, Result<A, B>>,
  c: (x: E) => Result<Result<E, F>, Result<A, B>>,
): void => {
  const f = (x: Result<A, B>): Result<F, B> =>
    x.isOkay ? x : k(x.value).flatMap(f, g);
  const g = (y: Result<E, F>): Result<F, B> =>
    y.isOkay ? new Fail(y.value) : c(y.value).flatMap(f, g);
  expect(m.flatMapUntil(k, c)).toStrictEqual(m.flatMap(k, c).flatMap(f, g));
};

const flatMapOkayUntilEquivalence = <E, A, B>(
  m: Result<E, A>,
  k: (a: A) => Result<E, Result<A, B>>,
): void => {
  const f = (x: Result<A, B>): Result<E, B> =>
    x.isOkay ? x : k(x.value).flatMapOkay(f);
  expect(m.flatMapOkayUntil(k)).toStrictEqual(m.flatMapOkay(k).flatMapOkay(f));
};

const flatMapFailUntilEquivalence = <E, F, A>(
  m: Result<E, A>,
  c: (x: E) => Result<Result<E, F>, A>,
): void => {
  const g = (y: Result<E, F>): Result<F, A> =>
    y.isOkay ? new Fail(y.value) : c(y.value).flatMapFail(g);
  expect(m.flatMapFailUntil(c)).toStrictEqual(m.flatMapFail(c).flatMapFail(g));
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

  describe("flatten", () => {
    it("should agree with flatMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          result(
            result(fc.anything(), fc.anything()),
            result(fc.anything(), fc.anything()),
          ),
          flattenDefinition,
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
});
