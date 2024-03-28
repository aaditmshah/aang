import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { id } from "../src/miscellaneous.js";
import { Pair } from "../src/pair.js";

import { pair } from "./arbitraries.js";

const mapIdentity = <A, B>(u: Pair<A, B>): void => {
  expect(u.map(id, id)).toStrictEqual(u);
};

const mapFstIdentity = <A, B>(u: Pair<A, B>): void => {
  expect(u.mapFst(id)).toStrictEqual(u);
};

const mapSndIdentity = <A, B>(u: Pair<A, B>): void => {
  expect(u.mapSnd(id)).toStrictEqual(u);
};

const ofParametricity = <A, B>(a: A, f: (a: A) => B): void => {
  expect(Pair.of(a).map(f, f)).toStrictEqual(Pair.of(f(a)));
};

const associateLeftInverse = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
  expect(u.associateRight().associateLeft()).toStrictEqual(u);
};

const associateRightInverse = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
  expect(u.associateLeft().associateRight()).toStrictEqual(u);
};

describe("Pair", () => {
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

  describe("of", () => {
    it("should be parametric", () => {
      expect.assertions(100);

      fc.assert(
        fc.property(fc.anything(), fc.func(fc.anything()), ofParametricity),
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
});
