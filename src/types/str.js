"use strict";

const fun   = require("./fun");
const curry = require("./curry");

module.exports = fun((functor, str) => {
    if (typeof str !== "string") {
        const value = JSON.stringify(str) || "function";
        throw new TypeError(`${value} is not a string`);
    } else return curry(functor, str);
});
