import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { id } from "../src/miscellaneous.js";
import type { Result } from "../src/result.js";
import { Fail, Okay } from "../src/result.js";

import { result } from "./arbitraries.js";

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
});
