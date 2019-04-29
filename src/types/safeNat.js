"use strict";

const fun       = require("./fun");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun((functor, safeNat) => {
    if (!Number.isSafeInteger(safeNat) || safeNat < 0) {
        const value = stringify(safeNat);
        throw new TypeError(`${value} is not a safe natural number`);
    } else return curry(functor, safeNat);
});
