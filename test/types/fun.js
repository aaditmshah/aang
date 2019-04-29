"use strict";

const assert = require("assert").strict;
const fun    = require("../../src/types/fun");

describe("fun", () => {
    const flip = fun(functor => (b, a) => functor(a, b));
    const sub  = (a, b) => a - b;
    const sub1 = flip(sub, 1);

    it("expects a function", () => {
        assert.throws(() => fun([1, 2, 3], [4, 5, 6]), TypeError);
    });

    it("checks whether the argument is a function", () => {
        assert.throws(() => flip([1, 2, 3]), TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(sub1(3), 2);
    });
});
