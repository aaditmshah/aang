"use strict";

const assert = require("assert").strict;
const array  = require("../../src/types/array");

describe("array", () => {
    const length = array(xs => xs.length);

    it("checks whether the argument is an array", () => {
        assert.throws(() => length(true), TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(length([1, 2, 3]), 3);
    })
});
