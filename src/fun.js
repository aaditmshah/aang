"use strict";

const curry = require("./curry");

module.exports = curry((functor1, functor2) => {
    checkFunction(functor1);
    checkFunction(functor2);
    return curry(functor1, functor2);
});

function checkFunction(functor) {
    if (typeof functor !== "function") {
        const value = JSON.stringify(functor);
        throw new TypeError(`${value} is not a function`);
    }
}
