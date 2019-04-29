"use strict";

const stringify = require("../stringify");

const curried = Symbol("curried");

Object.defineProperty(curry, curried, { value: true });

module.exports = curry;

function curry(functor, ...initArgs) {
    if (arguments.length === 0) return curry;

    if (typeof functor !== "function") {
        const value = stringify(functor);
        throw new TypeError(`${value} is not a function`);
    }

    if (functor[curried]) return functor(...initArgs);

    const arity = functor.length;
    const args = initArgs.length;

    if (args >= arity) {
        const result = functor(...initArgs.slice(0, arity));
        return typeof result === "function" || args > arity ?
            curry(result, ...initArgs.slice(arity)) : result;
    }

    const result = (...restArgs) => curry(functor, ...initArgs, ...restArgs);

    return Object.defineProperty(result, curried, { value: true });
}
