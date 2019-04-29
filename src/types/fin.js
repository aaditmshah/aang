"use strict";

const fun   = require("./fun");
const curry = require("./curry");

module.exports = fun((functor, fin) => {
    if (!Number.isFinite(fin)) {
        const value = JSON.stringify(fin) || "function";
        throw new TypeError(`${value} is not a finite number`);
    } else return curry(functor, fin);
});
