"use strict";

const fun       = require("./fun");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun((functor, fin) => {
    if (!Number.isFinite(fin)) {
        const value = stringify(fin);
        throw new TypeError(`${value} is not a finite number`);
    } else return curry(functor, fin);
});
