"use strict";

const assert = require("assert").strict;
const str    = require("../../src/types/str");

describe("str", () => {
    const scream = str(sentence => sentence.toUpperCase());

    it("checks whether the argument is a string", () => {
        assert.throws(() => scream([1, 2, 3]), TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(scream("High sir!"), "HIGH SIR!");
    });
});
