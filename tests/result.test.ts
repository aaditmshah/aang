import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { id } from "../src/miscellaneous.js";
import type { Result } from "../src/result.js";

import { result } from "./arbitraries.js";

const mapOkayIdentity = <E, A>(u: Result<E, A>): void => {
  expect(u.mapOkay(id)).toStrictEqual(u);
};

const mapFailIdentity = <E, A>(u: Result<E, A>): void => {
  expect(u.mapFail(id)).toStrictEqual(u);
};

describe("Result", () => {
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
});
