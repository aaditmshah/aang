import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import type { DateTime } from "../src/datetime.js";

import { datetime } from "./arbitraries.js";

const toStringDefinition = (m: DateTime): void => {
  expect(m.toString()).toStrictEqual(`DateTime(${m.value.getTime()})`);
};

describe("DateTime", () => {
  describe("toString", () => {
    it("should convert DateTime to a string", () => {
      expect.assertions(100);

      fc.assert(fc.property(datetime, toStringDefinition));
    });
  });
});
