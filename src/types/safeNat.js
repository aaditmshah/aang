"use strict";

const fun   = require("./fun");
const curry = require("./curry");

module.exports = fun((functor, safeNat) => {
    if (!Number.isSafeInteger(safeNat) || safeNat < 0) {
        const value = JSON.stringify(safeNat) || "function";
        throw new TypeError(`${value} is not a safe natural number`);
    } else return curry(functor, safeNat);
});
