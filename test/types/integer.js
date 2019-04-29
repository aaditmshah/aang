"use strict";

const assert  = require("assert").strict;
const integer = require("../../src/types/integer");

describe("integer", () => {
    const sub1 = integer(n => n - 1);

    it("checks whether the argument is a number", () => {
        assert.throws(() => sub1("abc"),      TypeError);
        assert.throws(() => sub1("abc" / 10), TypeError);
    });

    it("checks whether the argument is finite", () => {
        assert.throws(() => sub1(Infinity),  TypeError);
        assert.throws(() => sub1(-Infinity), TypeError);
    });

    it("checks whether the argument is an integer", () => {
        assert.throws(() => sub1(Math.PI), TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(sub1(2 ** 53), Number.MAX_SAFE_INTEGER);
    });
});
