"use strict";

const fun   = require("./fun");
const curry = require("./curry");

module.exports = fun((functor, nat) => {
    if (!Number.isInteger(nat) || nat < 0) {
        const value = JSON.stringify(nat) || "function";
        throw new TypeError(`${value} is not a natural number`);
    } else return curry(functor, nat);
});
