"use strict";

const fun       = require("./fun");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun((functor, safeInt) => {
    if (!Number.isSafeInteger(safeInt)) {
        const value = stringify(safeInt);
        throw new TypeError(`${value} is not a safe integer`);
    } else return curry(functor, safeInt);
});
