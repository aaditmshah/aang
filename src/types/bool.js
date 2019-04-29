"use strict";

const fun       = require("./fun");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun((functor, bool) => {
    if (typeof bool !== "boolean") {
        const value = stringify(bool);
        throw new TypeError(`${value} is not a boolean`);
    } else return curry(functor, bool);
});
