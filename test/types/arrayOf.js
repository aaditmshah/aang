"use strict";

const assert  = require("assert").strict;
const arrayOf = require("../../src/types/arrayOf");
const bool    = require("../../src/types/bool");

describe("arrayOf", () => {
    const length = arrayOf(bool, xs => xs.length);

    it("checks whether the argument is an array", () => {
        assert.throws(() => length(true), TypeError);
    });

    it("checks whether the elements match the given type", () => {
        assert.throws(() => length([42]), TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(length([true, false]), 2);
    })
});
