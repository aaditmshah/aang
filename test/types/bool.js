"use strict";

const assert = require("assert").strict;
const bool   = require("../../src/types/bool");

describe("bool", () => {
    const not = bool(x => !x);

    it("checks whether the argument is a boolean", () => {
        assert.throws(() => not([1, 2, 3]), TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(not(true), false);
    })
});
