import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import type { Result } from "../src/result.js";

import { result } from "./arbitraries.js";

const id = <A>(value: A): A => value;

const mapIdentity = <E, A>(u: Result<E, A>): void => {
  expect(u.map(id)).toStrictEqual(u);
};

const mapFailureIdentity = <E, A>(u: Result<E, A>): void => {
  expect(u.mapFailure(id)).toStrictEqual(u);
};

describe("Result", () => {
  describe("map", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(fc.property(result(fc.anything(), fc.anything()), mapIdentity));
    });
  });

  describe("mapFailure", () => {
    it("should preserve identity morphisms", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(result(fc.anything(), fc.anything()), mapFailureIdentity),
      );
    });
  });
});
