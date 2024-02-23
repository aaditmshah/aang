import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { UnsafeExtractError } from "../src/errors.js";
import { Exception } from "../src/exceptions.js";
import { id } from "../src/miscellaneous.js";
import type { Option } from "../src/option.js";
import { None, Some } from "../src/option.js";
import { Pair } from "../src/pair.js";
import type { Result } from "../src/result.js";
import { Fail, Okay } from "../src/result.js";

import { none, option, pair, result } from "./arbitraries.js";

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
  expect(u.andWith(v)).toStrictEqual(u.and(v).map((x) => x.fst));
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

const transposeMapNone = <A, E, B>(f: (a: A) => Result<E, B>): void => {
  expect(None.instance.transposeMap(f)).toStrictEqual(new Okay(None.instance));
};

const transposeMapSome = <A, E, B>(a: A, f: (a: A) => Result<E, B>): void => {
  expect(new Some(a).transposeMap(f)).toStrictEqual(f(a).mapOkay(Some.of));
};

const transposeDefinition = <E, B>(u: Option<Result<E, B>>): void => {
  expect(u.transpose()).toStrictEqual(u.transposeMap(id));
};

const safeExtractSome = <A>(a: A, x: A): void => {
  expect(new Some(a).safeExtract(x)).toStrictEqual(a);
};

const safeExtractNone = <A>(x: A): void => {
  expect(None.instance.safeExtract(x)).toStrictEqual(x);
};

const unsafeExtractSome = <A>(a: A, x: string): void => {
  expect(new Some(a).unsafeExtract(x)).toStrictEqual(a);
};

const unsafeExtractError = (x: string): void => {
  const error = new UnsafeExtractError(x);
  expect(() => None.instance.unsafeExtract(x)).toThrow(error);
  expect(() => None.instance.unsafeExtract(x)).toThrow(UnsafeExtractError);
};

const unsafeExtractException = (x: string): void => {
  class SomeException extends Exception {}
  const error = new SomeException(x);
  expect(() => None.instance.unsafeExtract(error)).toThrow(error);
  expect(() => None.instance.unsafeExtract(error)).toThrow(SomeException);
};

const toResultSuccess = <E, A>(a: A, x: E): void => {
  expect(new Some(a).toResult(x)).toStrictEqual(new Okay(a));
};

const toResultFailure = <E>(m: None, x: E): void => {
  expect(m.toResult(x)).toStrictEqual(new Fail(x));
};

const iterateSome = <A>(a: A): void => {
  expect([...new Some(a)]).toStrictEqual([a]);
};

const iterateNone = (m: None): void => {
  expect([...m]).toStrictEqual([]);
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

  describe("andWith", () => {
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
    it("should transpose None", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.func(result(fc.anything(), fc.anything())),
          transposeMapNone,
        ),
      );
    });

    it("should transpose Some", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          fc.anything(),
          fc.func(result(fc.anything(), fc.anything())),
          transposeMapSome,
        ),
      );
    });
  });

  describe("transpose", () => {
    it("should agree with transposeMap", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(
          option(result(fc.anything(), fc.anything())),
          transposeDefinition,
        ),
      );
    });
  });

  describe("safeExtract", () => {
    it("should extract the value from Some", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fc.anything(), safeExtractSome));
    });

    it("should return the default value for None", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), safeExtractNone));
    });
  });

  describe("unsafeExtract", () => {
    it("should extract the value from Some", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fc.string(), unsafeExtractSome));
    });

    it("should throw an UnsafeExtractError for None", () => {
      expect.assertions(200);

      fc.assert(fc.property(fc.string(), unsafeExtractError));
    });

    it("should throw the given exception for None", () => {
      expect.assertions(200);

      fc.assert(fc.property(fc.string(), unsafeExtractException));
    });
  });

  describe("toResult", () => {
    it("should convert Some to Success", () => {
      expect.assertions(100);

      fc.assert(fc.property(fc.anything(), fc.anything(), toResultSuccess));
    });

    it("should convert None to Failure", () => {
      expect.assertions(100);

      fc.assert(fc.property(none, fc.anything(), toResultFailure));
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
});
