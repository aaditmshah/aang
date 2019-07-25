"use strict";

const curry     = require("./curry");
const stringify = require("../stringify");

module.exports = curry(functor1 => {
    checkFunction(functor1);

    return functor2 => {
        checkFunction(functor2);
        return curry(functor1, functor2);
    };
});

function checkFunction(functor) {
    if (typeof functor !== "function") {
        const value = stringify(functor);
        throw new TypeError(`${value} is not a function`);
    }
}
