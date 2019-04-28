"use strict";

const assert = require("assert").strict;
const nat    = require("../src/nat");

describe("nat", () => {
    const sub1 = nat(n => n - 1);

    it("checks whether the argument is a number", () => {
        assert.throws(() => sub1("abc"),      TypeError);
        assert.throws(() => sub1("abc" / 10), TypeError);
    });

    it("checks whether the argument is finite", () => {
        assert.throws(() => sub1(Infinity),  TypeError);
        assert.throws(() => sub1(-Infinity), TypeError);
    });

    it("checks whether the argument is a natural number", () => {
        assert.throws(() => sub1(Math.PI), TypeError);
        assert.throws(() => sub1(-1),      TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(sub1(1), 0);
    });
});
