"use strict";

const assert = require("assert").strict;
const curry  = require("../src/curry");

describe("curry", () => {
    it("expects a function", () => {
        assert.throws(() => curry([1, 2, 3], 4, 5, 6), TypeError);
    });

    it("is idempotent", () => {
        const vars = Array.from({ length: 10 }, (_, index) => "var" + index);
        const functor = eval(`(${vars.join(", ")}) => [${vars.join(", ")}]`);
        functionStrictEqual(curry(curry(functor)), curry(functor), vars);
    });

    it("is curried", () => {
        const vars = Array.from({ length: 10 }, (_, index) => "var" + index);
        const functor = eval(`(${vars.join(", ")}) => [${vars.join(", ")}]`);
        resultStrictEqual(curry, [functor, ...vars], vars);
    });

    it("can curry and uncurry", () => {
        const vars = Array.from({ length: 10 }, (_, index) => "var" + index);
        const functor1 = eval(`(${vars.join(", ")}) => [${vars.join(", ")}]`);
        const functor2 = eval(`${vars.join(" => ")} => [${vars.join(", ")}]`);
        functionStrictEqual(curry(functor1), curry(functor2), vars);
    });

    function functionStrictEqual(functor1, functor2, args) {
        resultStrictEqual(functor1, args, functor2(...args));
        resultStrictEqual(functor2, args, functor1(...args));
    }

    function resultStrictEqual(functor1, args, result) {
        const functor2 = epsilonTransition(functor1);

        const {length} = args;

        for (let i = 1; i < length; i++) {
            const initArgs = args.slice(0, i);
            const restArgs = args.slice(i);
            resultStrictEqual(functor2(...initArgs), restArgs, result);
        }

        assert.deepStrictEqual(functor2(...args), result);
    }

    function epsilonTransition(functor) {
        return Math.random() < 0.5 ? epsilonTransition(functor()) : functor();
    }
});
