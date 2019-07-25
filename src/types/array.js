"use strict";

const fun       = require("./fun");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun((functor, array) => {
    if (!Array.isArray(array)) {
        const value = stringify(array);
        throw new TypeError(`${value} is not an array`);
    } else return curry(functor, array);
});
