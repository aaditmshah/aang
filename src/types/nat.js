"use strict";

const fun       = require("./fun");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun((functor, nat) => {
    if (!Number.isInteger(nat) || nat < 0) {
        const value = stringify(nat);
        throw new TypeError(`${value} is not a natural number`);
    } else return curry(functor, nat);
});
