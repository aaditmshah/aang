"use strict";

const assert = require("assert").strict;
const chr    = require("../../src/types/chr");

describe("chr", () => {
    const upcase = chr(letter => letter.toUpperCase());

    it("checks whether the argument is a character", () => {
        assert.throws(() => upcase("High sir!"), TypeError);
    });

    it("applies the function to the argument", () => {
        assert.strictEqual(upcase("a"), "A");
    });
});
