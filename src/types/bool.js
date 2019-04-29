"use strict";

const fun   = require("./fun");
const curry = require("./curry");

module.exports = fun((functor, bool) => {
    if (typeof bool !== "boolean") {
        const value = JSON.stringify(bool) || "function";
        throw new TypeError(`${value} is not a boolean`);
    } else return curry(functor, bool);
});
