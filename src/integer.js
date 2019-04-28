"use strict";

const fun   = require("./fun");
const curry = require("./curry");

module.exports = fun((functor, integer) => {
    if (!Number.isSafeInteger(integer)) {
        const value = JSON.stringify(integer);
        throw new TypeError(`${value} is not a safe integer`);
    } else return curry(functor, integer);
});
