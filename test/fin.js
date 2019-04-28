"use strict";

const assert = require("assert").strict;
const fin    = require("../src/fin");

describe("fin", () => {
    const reciprocal = fin(n => 1 / n);

    it("checks whether the argument is a number", () => {
        assert.throws(() => reciprocal("abc"),      TypeError);
        assert.throws(() => reciprocal("abc" / 10), TypeError);
    });

    it("checks whether the argument is a finite", () => {
        assert.throws(() => reciprocal(Infinity),  TypeError);
        assert.throws(() => reciprocal(-Infinity), TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(reciprocal(0),   Infinity);
        assert.strictEqual(reciprocal(-0), -Infinity);
    });
});
