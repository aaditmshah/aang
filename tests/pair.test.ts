import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { id } from "../src/miscellaneous.js";
import type { Option } from "../src/option.js";
import { Some } from "../src/option.js";
import { Pair } from "../src/pair.js";
import type { Result } from "../src/result.js";
import { Fail, Okay } from "../src/result.js";
import type { Semigroup } from "../src/semigroup.js";
import { Text } from "../src/text.js";

import { option, pair, result, text } from "./arbitraries.js";
import { collatz } from "./utils.js";

const fromDefinition = <A>(a: A): void => {
  expect(Pair.from(a)).toStrictEqual(Pair.of(a, a));
};

const toStringDefinition = <A, B>(m: Pair<A, B>): void => {
  try {
    expect(m.toString()).toStrictEqual(
      `Pair(${String(m.fst)}, ${String(m.snd)})`,
    );
  } catch (error) {
    expect(error).toBeInstanceOf(TypeError);
  }
};

const foldEquivalence = <A, B, C>(a: A, b: B, f: (a: A, b: B) => C): void => {
  expect(new Pair(a, b).fold(f)).toStrictEqual(f(a, b));
};

const mapIdentity = <A, B>(u: Pair<A, B>): void => {
  expect(u.map(id, id)).toStrictEqual(u);
};

const mapFstIdentity = <A, B>(u: Pair<A, B>): void => {
  expect(u.mapFst(id)).toStrictEqual(u);
};

const mapSndIdentity = <A, B>(u: Pair<A, B>): void => {
  expect(u.mapSnd(id)).toStrictEqual(u);
};

const replaceFstDefinition = <A, B, C>(u: Pair<A, C>, b: B): void => {
  expect(u.replaceFst(b)).toStrictEqual(u.mapFst(() => b));
};

const replaceSndDefinition = <A, B, C>(u: Pair<A, B>, c: C): void => {
  expect(u.replaceSnd(c)).toStrictEqual(u.mapSnd(() => c));
};

const andLeftIdentity = <A, B>(v: Pair<A, B>): void => {
  expect(new Pair(undefined, undefined).and(v)).toStrictEqual(
    v.map(
      (y) => new Pair(undefined, y),
      (y) => new Pair(undefined, y),
    ),
  );
};

const andRightIdentity = <A, B>(u: Pair<A, B>): void => {
  expect(u.and(new Pair(undefined, undefined))).toStrictEqual(
    u.map(
      (x) => new Pair(x, undefined),
      (x) => new Pair(x, undefined),
    ),
  );
};

const andAssociativity = <A, B, C, D, E, F>(
  u: Pair<A, B>,
  v: Pair<C, D>,
  w: Pair<E, F>,
): void => {
  expect(
    u.and(v.and(w)).map(
      (x) => x.associateLeft(),
      (x) => x.associateLeft(),
    ),
  ).toStrictEqual(u.and(v).and(w));
};

const andFstDefinition = <A, B, C>(u: Pair<A, C>, b: B): void => {
  expect(u.andFst(b)).toStrictEqual(new Pair(u, b).exchangeSnd());
};

const andSndDefinition = <A, B, C>(u: Pair<A, B>, c: C): void => {
  expect(u.andSnd(c)).toStrictEqual(new Pair(u, c).associateRight());
};

const flatMapFstLeftIdentity = <A, B, C extends Semigroup<C>>(
  a: A,
  c: C,
  k: (a: A) => Pair<B, C>,
): void => {
  expect(new Pair(a, c).flatMapFst(k)).toStrictEqual(k(a));
};

const flatMapFstRightIdentity = <A, B extends Semigroup<B>>(
  m: Pair<A, B>,
  b: B,
): void => {
  expect(m.flatMapFst((a) => new Pair(a, b))).toStrictEqual(m);
};

const flatMapFstAssociativity = <A, B, C, D extends Semigroup<D>>(
  m: Pair<A, D>,
  k: (a: A) => Pair<B, D>,
  h: (b: B) => Pair<C, D>,
): void => {
  expect(m.flatMapFst((a) => k(a).flatMapFst(h))).toStrictEqual(
    m.flatMapFst(k).flatMapFst(h),
  );
};

const flatMapSndLeftIdentity = <A extends Semigroup<A>, B, C>(
  a: A,
  b: B,
  k: (b: B) => Pair<A, C>,
): void => {
  expect(new Pair(a, b).flatMapSnd(k)).toStrictEqual(k(b));
};

const flatMapSndRightIdentity = <A extends Semigroup<A>, B>(
  m: Pair<A, B>,
  a: A,
): void => {
  expect(m.flatMapSnd((b) => new Pair(a, b))).toStrictEqual(m);
};

const flatMapSndAssociativity = <A extends Semigroup<A>, B, C, D>(
  m: Pair<A, B>,
  k: (b: B) => Pair<A, C>,
  h: (c: C) => Pair<A, D>,
): void => {
  expect(m.flatMapSnd((b) => k(b).flatMapSnd(h))).toStrictEqual(
    m.flatMapSnd(k).flatMapSnd(h),
  );
};

const flattenFstDefinition = <A, B extends Semigroup<B>>(
  u: Pair<Pair<A, B>, B>,
): void => {
  expect(u.flattenFst()).toStrictEqual(u.flatMapFst(id));
};

const flattenSndDefinition = <A extends Semigroup<A>, B>(
  u: Pair<A, Pair<A, B>>,
): void => {
  expect(u.flattenSnd()).toStrictEqual(u.flatMapSnd(id));
};

const flatMapFstUntilEquivalence = <A, B, C extends Semigroup<C>>(
  m: Pair<A, C>,
  c: C,
  k: (a: A) => Pair<Result<B, A>, C>,
): void => {
  const f = (x: Result<B, A>): Pair<B, C> =>
    x.isOkay ? new Pair(x.value, c) : k(x.value).flatMapFst(f);
  expect(m.flatMapFstUntil(k)).toStrictEqual(m.flatMapFst(k).flatMapFst(f));
};

const flatMapSndUntilEquivalence = <A extends Semigroup<A>, B, C>(
  m: Pair<A, B>,
  a: A,
  k: (b: B) => Pair<A, Result<C, B>>,
): void => {
  const g = (x: Result<C, B>): Pair<A, C> =>
    x.isOkay ? new Pair(a, x.value) : k(x.value).flatMapSnd(g);
  expect(m.flatMapSndUntil(k)).toStrictEqual(m.flatMapSnd(k).flatMapSnd(g));
};

const commuteInverse = <A, B>(u: Pair<A, B>): void => {
  expect(u.commute().commute()).toStrictEqual(u);
};

const andMapFstOptionDefinition = <X, A, B>(
  u: Pair<X, B>,
  f: (x: X) => Option<A>,
): void => {
  expect(u.andMapFstOption(f)).toStrictEqual(u.andMapOption(f, Some.of));
};

const andMapSndOptionDefinition = <Y, A, B>(
  u: Pair<A, Y>,
  g: (y: Y) => Option<B>,
): void => {
  expect(u.andMapSndOption(g)).toStrictEqual(u.andMapOption(Some.of, g));
};

const andOptionDefinition = <A, B>(u: Pair<Option<A>, Option<B>>): void => {
  expect(u.andOption()).toStrictEqual(u.andMapOption(id, id));
};

const andFstOptionDefinition = <A, B>(u: Pair<Option<A>, B>): void => {
  expect(u.andFstOption()).toStrictEqual(u.andMapOption(id, Some.of));
};

const andSndOptionDefinition = <A, B>(u: Pair<A, Option<B>>): void => {
  expect(u.andSndOption()).toStrictEqual(u.andMapOption(Some.of, id));
};

const andMapFstResultDefinition = <X, A, B, E>(
  u: Pair<X, B>,
  f: (x: X) => Result<A, E>,
): void => {
  expect(u.andMapFstResult(f)).toStrictEqual(u.andMapResult(f, Okay.of));
};

const andMapSndResultDefinition = <Y, A, B, E>(
  u: Pair<A, Y>,
  g: (y: Y) => Result<B, E>,
): void => {
  expect(u.andMapSndResult(g)).toStrictEqual(u.andMapResult(Okay.of, g));
};

const andResultDefinition = <A, B, E>(
  u: Pair<Result<A, E>, Result<B, E>>,
): void => {
  expect(u.andResult()).toStrictEqual(u.andMapResult(id, id));
};

const andFstResultDefinition = <A, B, E>(u: Pair<Result<A, E>, B>): void => {
  expect(u.andFstResult()).toStrictEqual(u.andMapResult(id, Okay.of));
};

const andSndResultDefinition = <A, B, E>(u: Pair<A, Result<B, E>>): void => {
  expect(u.andSndResult()).toStrictEqual(u.andMapResult(Okay.of, id));
};

const orMapFstResultDefinition = <X, A, E, F>(
  u: Pair<X, F>,
  f: (x: X) => Result<A, E>,
): void => {
  expect(u.orMapFstResult(f)).toStrictEqual(u.orMapResult(f, Fail.of));
};

const orMapSndResultDefinition = <Y, A, E, F>(
  u: Pair<E, Y>,
  g: (y: Y) => Result<A, F>,
): void => {
  expect(u.orMapSndResult(g)).toStrictEqual(u.orMapResult(Fail.of, g));
};

const orResultDefinition = <A, E, F>(
  u: Pair<Result<A, E>, Result<A, F>>,
): void => {
  expect(u.orResult()).toStrictEqual(u.orMapResult(id, id));
};

const orFstResultDefinition = <A, E, F>(u: Pair<Result<A, E>, F>): void => {
  expect(u.orFstResult()).toStrictEqual(u.orMapResult(id, Fail.of));
};

const orSndResultDefinition = <A, E, F>(u: Pair<E, Result<A, F>>): void => {
  expect(u.orSndResult()).toStrictEqual(u.orMapResult(Fail.of, id));
};

const distributeMapFstDefinition = <X, A, B, C>(
  u: Pair<X, C>,
  f: (x: X) => Pair<A, B>,
): void => {
  expect(u.distributeMapFst(f)).toStrictEqual(u.distributeMap(f, Pair.from));
};

const distributeMapSndDefinition = <Y, A, B, C>(
  u: Pair<A, Y>,
  g: (y: Y) => Pair<B, C>,
): void => {
  expect(u.distributeMapSnd(g)).toStrictEqual(u.distributeMap(Pair.from, g));
};

const distributeDefinition = <A, B, C, D>(
  u: Pair<Pair<A, B>, Pair<C, D>>,
): void => {
  expect(u.distribute()).toStrictEqual(u.distributeMap(id, id));
};

const distributeFstDefinition = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
  expect(u.distributeFst()).toStrictEqual(u.distributeMap(id, Pair.from));
};

const distributeSndDefinition = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
  expect(u.distributeSnd()).toStrictEqual(u.distributeMap(Pair.from, id));
};

const exchangeMapSndDefinition = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
  expect(u.exchangeMapSnd(id)).toStrictEqual(u.exchangeSnd());
};

const associateMapLeftDefinition = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
  expect(u.associateMapLeft(id)).toStrictEqual(u.associateLeft());
};

const exchangeSndInverse = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
  expect(u.exchangeSnd().exchangeSnd()).toStrictEqual(u);
};

const associateLeftInverse = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
  expect(u.associateRight().associateLeft()).toStrictEqual(u);
};

const exchangeMapFstDefinition = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
  expect(u.exchangeMapFst(id)).toStrictEqual(u.exchangeFst());
};

const associateMapRightDefinition = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
  expect(u.associateMapRight(id)).toStrictEqual(u.associateRight());
};

const exchangeFstInverse = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
  expect(u.exchangeFst().exchangeFst()).toStrictEqual(u);
};

const associateRightInverse = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
  expect(u.associateLeft().associateRight()).toStrictEqual(u);
};

const distributeMapOkayDefinition = <A, B, C>(
  u: Pair<A, Result<B, C>>,
): void => {
  expect(u.distributeMapOkay(id)).toStrictEqual(u.distributeOkay());
};

const distributeOkayInverse = <A, B, C>(u: Pair<A, Result<B, C>>): void => {
  expect(u.distributeOkay().collectSnd()).toStrictEqual(u);
};

const distributeMapFailDefinition = <A, B, C>(
  u: Pair<Result<A, B>, C>,
): void => {
  expect(u.distributeMapFail(id)).toStrictEqual(u.distributeFail());
};

const distributeFailInverse = <A, B, C>(u: Pair<Result<A, B>, C>): void => {
  expect(u.distributeFail().collectFst()).toStrictEqual(u);
};

const valuesDefinition = <A, B>(a: A, b: B): void => {
  expect(new Pair(a, b).values()).toStrictEqual([a, b]);
};

describe("Pair", () => {
  describe("from", () => {
    it("should agree with Pair.of", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fromDefinition));
    });
  });

  describe("toString", () => {
    it("should convert the Pair to a string", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(pair(fc.anything(), fc.anything()), toStringDefinition),
      );
    });
  });

  describe("fold", () => {
    it("should fold the Pair", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.anything(),
          fc.anything(),
          fc.func(fc.anything()),
          foldEquivalence,
        ),
      );
    });
  });

  describe("map", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(fc.property(pair(fc.anything(), fc.anything()), mapIdentity));
    });
  });

  describe("mapFst", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(pair(fc.anything(), fc.anything()), mapFstIdentity),
      );
    });
  });

  describe("mapSnd", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(pair(fc.anything(), fc.anything()), mapSndIdentity),
      );
    });
  });

  describe("replaceFst", () => {
    it("should agree with mapFst", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.anything(),
          replaceFstDefinition,
        ),
      );
    });
  });

  describe("replaceSnd", () => {
    it("should agree with mapSnd", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.anything(),
          replaceSndDefinition,
        ),
      );
    });
  });

  describe("and", () => {
    it("should have a left identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(pair(fc.anything(), fc.anything()), andLeftIdentity),
      );
    });

    it("should have a right identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(pair(fc.anything(), fc.anything()), andRightIdentity),
      );
    });

    it("should be associative", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          pair(fc.anything(), fc.anything()),
          pair(fc.anything(), fc.anything()),
          andAssociativity,
        ),
      );
    });
  });

  describe("andFst", () => {
    it("should agree with exchangeSnd", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.anything(),
          andFstDefinition,
        ),
      );
    });
  });

  describe("andSnd", () => {
    it("should agree with associateRight", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.anything(),
          andSndDefinition,
        ),
      );
    });
  });

  describe("flatMapFst", () => {
    it("should have a left identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.anything(),
          fc.constant(new Text("")),
          fc.func(pair(fc.anything(), text)),
          flatMapFstLeftIdentity,
        ),
      );
    });

    it("should have a right identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), text),
          fc.constant(new Text("")),
          flatMapFstRightIdentity,
        ),
      );
    });

    it("should be associative", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), text),
          fc.func(pair(fc.anything(), text)),
          fc.func(pair(fc.anything(), text)),
          flatMapFstAssociativity,
        ),
      );
    });
  });

  describe("flatMapSnd", () => {
    it("should have a left identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.constant(new Text("")),
          fc.anything(),
          fc.func(pair(text, fc.anything())),
          flatMapSndLeftIdentity,
        ),
      );
    });

    it("should have a right identity", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(text, fc.anything()),
          fc.constant(new Text("")),
          flatMapSndRightIdentity,
        ),
      );
    });

    it("should be associative", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(text, fc.anything()),
          fc.func(pair(text, fc.anything())),
          fc.func(pair(text, fc.anything())),
          flatMapSndAssociativity,
        ),
      );
    });
  });

  describe("flattenFst", () => {
    it("should agree with flatMapFst", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(pair(fc.anything(), text), text),
          flattenFstDefinition,
        ),
      );
    });
  });

  describe("flattenSnd", () => {
    it("should agree with flatMapSnd", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(text, pair(text, fc.anything())),
          flattenSndDefinition,
        ),
      );
    });
  });

  describe("flatMapFstUntil", () => {
    it("should be equivalent to multiple flatMapFst calls", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.integer({ min: 1 }), text),
          fc.constant(new Text("")),
          fc.func(text).map((f) => (n: number) => new Pair(collatz(n), f(n))),
          flatMapFstUntilEquivalence,
        ),
      );
    });
  });

  describe("flatMapSndUntil", () => {
    it("should be equivalent to multiple flatMapSnd calls", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(text, fc.integer({ min: 1 })),
          fc.constant(new Text("")),
          fc.func(text).map((f) => (n: number) => new Pair(f(n), collatz(n))),
          flatMapSndUntilEquivalence,
        ),
      );
    });
  });

  describe("commute", () => {
    it("should be its own inverse", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(pair(fc.anything(), fc.anything()), commuteInverse),
      );
    });
  });

  describe("andMapFstOption", () => {
    it("should agree with andMapOption", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.func(option(fc.anything())),
          andMapFstOptionDefinition,
        ),
      );
    });
  });

  describe("andMapSndOption", () => {
    it("should agree with andMapOption", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.func(option(fc.anything())),
          andMapSndOptionDefinition,
        ),
      );
    });
  });

  describe("andOption", () => {
    it("should agree with andMapOption", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(option(fc.anything()), option(fc.anything())),
          andOptionDefinition,
        ),
      );
    });
  });

  describe("andFstOption", () => {
    it("should agree with andMapOption", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(option(fc.anything()), fc.anything()),
          andFstOptionDefinition,
        ),
      );
    });
  });

  describe("andSndOption", () => {
    it("should agree with andMapOption", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), option(fc.anything())),
          andSndOptionDefinition,
        ),
      );
    });
  });

  describe("andMapFstResult", () => {
    it("should agree with andMapResult", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          andMapFstResultDefinition,
        ),
      );
    });
  });

  describe("andMapSndResult", () => {
    it("should agree with andMapResult", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          andMapSndResultDefinition,
        ),
      );
    });
  });

  describe("andResult", () => {
    it("should agree with andMapResult", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(
            result(fc.anything(), fc.anything()),
            result(fc.anything(), fc.anything()),
          ),
          andResultDefinition,
        ),
      );
    });
  });

  describe("andFstResult", () => {
    it("should agree with andMapResult", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(result(fc.anything(), fc.anything()), fc.anything()),
          andFstResultDefinition,
        ),
      );
    });
  });

  describe("andSndResult", () => {
    it("should agree with andMapResult", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), result(fc.anything(), fc.anything())),
          andSndResultDefinition,
        ),
      );
    });
  });

  describe("orMapFstResult", () => {
    it("should agree with orMapResult", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          orMapFstResultDefinition,
        ),
      );
    });
  });

  describe("orMapSndResult", () => {
    it("should agree with orMapResult", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.func(result(fc.anything(), fc.anything())),
          orMapSndResultDefinition,
        ),
      );
    });
  });

  describe("orResult", () => {
    it("should agree with orMapResult", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(
            result(fc.anything(), fc.anything()),
            result(fc.anything(), fc.anything()),
          ),
          orResultDefinition,
        ),
      );
    });
  });

  describe("orFstResult", () => {
    it("should agree with orMapResult", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(result(fc.anything(), fc.anything()), fc.anything()),
          orFstResultDefinition,
        ),
      );
    });
  });

  describe("orSndResult", () => {
    it("should agree with orMapResult", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), result(fc.anything(), fc.anything())),
          orSndResultDefinition,
        ),
      );
    });
  });

  describe("distributeMapFst", () => {
    it("should agree with distributeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.func(pair(fc.anything(), fc.anything())),
          distributeMapFstDefinition,
        ),
      );
    });
  });

  describe("distributeMapSnd", () => {
    it("should agree with distributeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), fc.anything()),
          fc.func(pair(fc.anything(), fc.anything())),
          distributeMapSndDefinition,
        ),
      );
    });
  });

  describe("distribute", () => {
    it("should agree with distributeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(
            pair(fc.anything(), fc.anything()),
            pair(fc.anything(), fc.anything()),
          ),
          distributeDefinition,
        ),
      );
    });
  });

  describe("distributeFst", () => {
    it("should agree with distributeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(pair(fc.anything(), fc.anything()), fc.anything()),
          distributeFstDefinition,
        ),
      );
    });
  });

  describe("distributeSnd", () => {
    it("should agree with distributeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), pair(fc.anything(), fc.anything())),
          distributeSndDefinition,
        ),
      );
    });
  });

  describe("exchangeMapSnd", () => {
    it("should agree with exchangeSnd", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(pair(fc.anything(), fc.anything()), fc.anything()),
          exchangeMapSndDefinition,
        ),
      );
    });
  });

  describe("associateMapLeft", () => {
    it("should agree with associateLeft", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), pair(fc.anything(), fc.anything())),
          associateMapLeftDefinition,
        ),
      );
    });
  });

  describe("exchangeSnd", () => {
    it("should be its own inverse", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(pair(fc.anything(), fc.anything()), fc.anything()),
          exchangeSndInverse,
        ),
      );
    });
  });

  describe("associateLeft", () => {
    it("should be the inverse of associateRight", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(pair(fc.anything(), fc.anything()), fc.anything()),
          associateLeftInverse,
        ),
      );
    });
  });

  describe("exchangeMapFst", () => {
    it("should agree with exchangeFst", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), pair(fc.anything(), fc.anything())),
          exchangeMapFstDefinition,
        ),
      );
    });
  });

  describe("associateMapRight", () => {
    it("should agree with associateRight", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(pair(fc.anything(), fc.anything()), fc.anything()),
          associateMapRightDefinition,
        ),
      );
    });
  });

  describe("exchangeFst", () => {
    it("should be its own inverse", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), pair(fc.anything(), fc.anything())),
          exchangeFstInverse,
        ),
      );
    });
  });

  describe("associateRight", () => {
    it("should be the inverse of associateLeft", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), pair(fc.anything(), fc.anything())),
          associateRightInverse,
        ),
      );
    });
  });

  describe("distributeMapOkay", () => {
    it("should agree with distributeOkay", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), result(fc.anything(), fc.anything())),
          distributeMapOkayDefinition,
        ),
      );
    });
  });

  describe("distributeOkay", () => {
    it("should be inverted by Result#collectSnd", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(fc.anything(), result(fc.anything(), fc.anything())),
          distributeOkayInverse,
        ),
      );
    });
  });

  describe("distributeMapFail", () => {
    it("should agree with distributeFail", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(result(fc.anything(), fc.anything()), fc.anything()),
          distributeMapFailDefinition,
        ),
      );
    });
  });

  describe("distributeFail", () => {
    it("should be inverted by Result#collectFst", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          pair(result(fc.anything(), fc.anything()), fc.anything()),
          distributeFailInverse,
        ),
      );
    });
  });

  describe("values", () => {
    it("should return the values of the pair", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fc.anything(), valuesDefinition));
    });
  });
});
