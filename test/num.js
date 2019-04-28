"use strict";

const assert = require("assert").strict;
const num    = require("../src/num");

describe("num", () => {
    const reciprocal = num(n => 1 / n);

    it("checks whether the argument is a number", () => {
        assert.throws(() => reciprocal("abc"),      TypeError);
        assert.throws(() => reciprocal("abc" / 10), TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(reciprocal(Infinity),   0);
        assert.strictEqual(reciprocal(-Infinity), -0);
    });
});
