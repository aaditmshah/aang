"use strict";

const fun   = require("./fun");
const curry = require("./curry");

module.exports = fun((functor, unsafeInt) => {
    if (!Number.isInteger(unsafeInt)) {
        const value = JSON.stringify(unsafeInt);
        throw new TypeError(`${value} is not an integer`);
    } else return curry(functor, unsafeInt);
});
