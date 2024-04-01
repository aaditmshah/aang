import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { id } from "../src/miscellaneous.js";
import type { Option } from "../src/option.js";
import { Some } from "../src/option.js";
import { Pair } from "../src/pair.js";

import { option, pair } from "./arbitraries.js";

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

const associateLeftInverse = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
  expect(u.associateRight().associateLeft()).toStrictEqual(u);
};

const associateRightInverse = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
  expect(u.associateLeft().associateRight()).toStrictEqual(u);
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

  describe("values", () => {
    it("should return the values of the pair", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fc.anything(), valuesDefinition));
    });
  });
});
