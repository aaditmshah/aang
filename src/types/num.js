"use strict";

const fun       = require("./fun");
const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = fun((functor, num) => {
    if (num !== +num) {
        const value = stringify(num);
        throw new TypeError(`${value} is not a number`);
    } else return curry(functor, num);
});
