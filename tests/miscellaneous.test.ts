import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Option } from "../src/option.js";

import { uncurry2, uncurry3, uncurry4 } from "../src/miscellaneous.js";
import { option } from "./arbitraries.js";

const uncurry2Equivalence = <A, B, C>(u: Option<A>, v: Option<B>, f: (a: A, b: B) => C): void => {
	expect(u.and(v).map(uncurry2(f))).toStrictEqual(u.and(v).map((x) => x.fold(f)));
};

const uncurry3Equivalence = <A, B, C, D>(
	u: Option<A>,
	v: Option<B>,
	w: Option<C>,
	f: (a: A, b: B, c: C) => D,
): void => {
	expect(u.and(v).and(w).map(uncurry3(f))).toStrictEqual(
		u
			.and(v)
			.and(w)
			.map((x) => x.fold((y, c) => uncurry2((a: A, b: B): D => f(a, b, c))(y))),
	);
};

const uncurry4Equivalence = <A, B, C, D, E>(
	u: Option<A>,
	v: Option<B>,
	w: Option<C>,
	x: Option<D>,
	f: (a: A, b: B, c: C, d: D) => E,
): void => {
	expect(u.and(v).and(w).and(x).map(uncurry4(f))).toStrictEqual(
		u
			.and(v)
			.and(w)
			.and(x)
			.map((y) => y.fold((z, d) => uncurry3((a: A, b: B, c: C): E => f(a, b, c, d))(z))),
	);
};

describe("uncurry2", () => {
	it("should agree with fold", () => {
		expect.assertions(100);

		fc.assert(
			fc.property(
				option(fc.anything()),
				option(fc.anything()),
				fc.func(fc.anything()),
				uncurry2Equivalence,
			),
		);
	});
});

describe("uncurry3", () => {
	it("should agree with uncurry2", () => {
		expect.assertions(100);

		fc.assert(
			fc.property(
				option(fc.anything()),
				option(fc.anything()),
				option(fc.anything()),
				fc.func(fc.anything()),
				uncurry3Equivalence,
			),
		);
	});
});

describe("uncurry4", () => {
	it("should agree with uncurry3", () => {
		expect.assertions(100);

		fc.assert(
			fc.property(
				option(fc.anything()),
				option(fc.anything()),
				option(fc.anything()),
				option(fc.anything()),
				fc.func(fc.anything()),
				uncurry4Equivalence,
			),
		);
	});
});
