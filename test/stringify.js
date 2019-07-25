"use strict";

const assert    = require("assert").strict;
const stringify = require("../src/stringify");

describe("stringify", () => {
    it("can stringify values", () => {
        assert.strictEqual(stringify(true),  "true");
        assert.strictEqual(stringify(false), "false");
    });

    it("can stringify undefined", () => {
        assert.strictEqual(stringify(undefined), "undefined");
    });

    it("can stringify functions", () => {
        assert.strictEqual(stringify(() => {}), "function");
    });

    it("can stringify circular objects", () => {
        const object = {};
        assert.strictEqual(stringify(object), "{}");
        object.circular = object;
        assert.strictEqual(stringify(object), "circular object");
    });
});
