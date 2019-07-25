"use strict";

const fun       = require("./fun");
const check     = require("./check");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun(type => fun((functor, array) => {
    if (!Array.isArray(array)) {
        const value = stringify(array);
        throw new TypeError(`${value} is not an array`);
    }

    for (const item of array) check(type, item);

    return curry(functor, array);
}));
