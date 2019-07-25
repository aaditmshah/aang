"use strict";

const assert = require("assert").strict;
const bool   = require("../../src/types/bool");
const check  = require("../../src/types/check");

describe("check", () => {
    it("checks whether the argument matches the type", () => {
        assert.throws(() => check(bool, 42), TypeError);
    });

    it("behaves like the identity function", () => {
        assert.strictEqual(check(bool, true),  true);
        assert.strictEqual(check(bool, false), false);
    });
});
