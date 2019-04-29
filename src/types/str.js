"use strict";

const fun       = require("./fun");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun((functor, str) => {
    if (typeof str !== "string") {
        const value = stringify(str);
        throw new TypeError(`${value} is not a string`);
    } else return curry(functor, str);
});
