"use strict";

const fun       = require("./fun");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun((functor, integer) => {
    if (!Number.isInteger(integer)) {
        const value = stringify(integer);
        throw new TypeError(`${value} is not an integer`);
    } else return curry(functor, integer);
});
