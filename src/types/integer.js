"use strict";

const fun   = require("./fun");
const curry = require("./curry");

module.exports = fun((functor, integer) => {
    if (!Number.isInteger(integer)) {
        const value = JSON.stringify(integer) || "function";
        throw new TypeError(`${value} is not an integer`);
    } else return curry(functor, integer);
});
