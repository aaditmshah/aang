"use strict";

const assert  = require("assert").strict;
const safeInt = require("../../src/types/safeInt");

describe("safeInt", () => {
    const sub1 = safeInt(n => n - 1);

    it("checks whether the argument is a number", () => {
        assert.throws(() => sub1("abc"),      TypeError);
        assert.throws(() => sub1("abc" / 10), TypeError);
    });

    it("checks whether the argument is finite", () => {
        assert.throws(() => sub1(Infinity),  TypeError);
        assert.throws(() => sub1(-Infinity), TypeError);
    });

    it("checks whether the argument is a safe integer", () => {
        assert.throws(() => sub1(Math.PI), TypeError);
        assert.throws(() => sub1(2 ** 53), TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(sub1(1), 0);
    });
});
