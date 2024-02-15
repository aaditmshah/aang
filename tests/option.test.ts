import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { UnsafeExtractError } from "../src/errors.js";
import { Exception } from "../src/exceptions.js";
import { id } from "../src/miscellaneous.js";
import type { Option } from "../src/option.js";
import { None, Some } from "../src/option.js";
import { Failure, Success } from "../src/result.js";

import { none, option } from "./arbitraries.js";

const mapIdentity = <A>(u: Option<A>): void => {
  expect(u.map(id)).toStrictEqual(u);
};

const flatMapLeftIdentity = <A, B>(a: A, k: (a: A) => Option<B>): void => {
  expect(new Some(a).flatMap(k)).toStrictEqual(k(a));
};

const flatMapRightIdentity = <A>(m: Option<A>): void => {
  expect(m.flatMap((value) => new Some(value))).toStrictEqual(m);
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
  expect(new Some(a).toResult(x)).toStrictEqual(new Success(a));
};

const toResultFailure = <E>(m: None, x: E): void => {
  expect(m.toResult(x)).toStrictEqual(new Failure(x));
};

const iterateSome = <A>(a: A): void => {
  expect([...new Some(a)]).toStrictEqual([a]);
};

const iterateNone = (m: None): void => {
  expect([...m]).toStrictEqual([]);
};

describe("Option", () => {
  describe("map", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(fc.property(option(fc.anything()), mapIdentity));
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
