"use strict";

const fun   = require("./fun");
const curry = require("./curry");

module.exports = fun((functor, safeInt) => {
    if (!Number.isSafeInteger(safeInt)) {
        const value = JSON.stringify(safeInt) || "function";
        throw new TypeError(`${value} is not a safe integer`);
    } else return curry(functor, safeInt);
});
