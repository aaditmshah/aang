import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { add } from "../src/add.js";

describe("add", () => {
  it("should be commutative", () => {
    expect.assertions(100);
    fc.assert(
      fc.property(fc.double(), fc.double(), (x, y) => {
        expect(add(x, y)).toStrictEqual(add(y, x));
      }),
    );
  });
});
