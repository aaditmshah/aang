"use strict";

const fun       = require("./fun");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun((functor, chr) => {
    if (typeof chr !== "string" || chr.length !== 1) {
        const value = stringify(chr);
        throw new TypeError(`${value} is not a string`);
    } else return curry(functor, chr);
});
