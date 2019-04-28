"use strict";

const fun   = require("./fun");
const curry = require("./curry");

module.exports = fun(bool);

function bool(functor, flag) {
    if (typeof flag !== "boolean") {
        const value = JSON.stringify(flag);
        throw new TypeError(`${value} is not a boolean`);
    }

    return curry(functor, flag);
}
