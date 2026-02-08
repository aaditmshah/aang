import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Option } from "./option.js";
import type { PartialOrder, Setoid, TotalOrder } from "./order.js";
import type { Ordering } from "./ordering.js";

import {
	bool,
	datetime,
	double,
	integer,
	option,
	pair,
	result,
	text,
} from "./arbitraries.test-util.js";
import { None, Some } from "./option.js";

const testSetoid = <A extends Setoid<A>>(name: string, value: fc.Arbitrary<A>) => {
	describe(`Setoid<${name}>`, () => {
		describe("isSame", () => {
			it("should be reflexive", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, (x: A) => {
						expect(x.isSame(x)).toStrictEqual(true);
					}),
				);
			});

			it("should be symmetric", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.isSame(y)).toStrictEqual(y.isSame(x));
					}),
				);
			});

			it("should be transitive", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, value, (x: A, y: A, z: A) => {
						expect(x.isSame(z)).toStrictEqual((x.isSame(y) && y.isSame(z)) || x.isSame(z));
					}),
				);
			});

			it("should respect function extensionality", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, fc.func(fc.anything()), <B>(x: A, y: A, f: (a: A) => B) => {
						expect(f(x)).toStrictEqual(f(x.isSame(y) ? y : x));
					}),
				);
			});
		});

		describe("isNotSame", () => {
			it("should agree with isSame", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.isNotSame(y)).toStrictEqual(!x.isSame(y));
					}),
				);
			});
		});
	});
};

const testPartialOrder = <A extends PartialOrder<A>>(name: string, value: fc.Arbitrary<A>) => {
	testSetoid(name, value);

	describe(`PartialOrder<${name}>`, () => {
		describe("isLess", () => {
			it("should be irreflexive", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, (x: A) => {
						expect(x.isLess(x)).toStrictEqual(false);
					}),
				);
			});

			it("should be transitive", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, value, (x: A, y: A, z: A) => {
						expect(x.isLess(z)).toStrictEqual((x.isLess(y) && y.isLess(z)) || x.isLess(z));
					}),
				);
			});

			it("should be the dual of isMore", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.isLess(y)).toStrictEqual(y.isMore(x));
					}),
				);
			});
		});

		describe("isNotLess", () => {
			it("should agree with isMore or isSame", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.isNotLess(y)).toStrictEqual(x.isMore(y) || x.isSame(y));
					}),
				);
			});
		});

		describe("isMore", () => {
			it("should be irreflexive", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, (x: A) => {
						expect(x.isMore(x)).toStrictEqual(false);
					}),
				);
			});

			it("should be transitive", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, value, (x: A, y: A, z: A) => {
						expect(x.isMore(z)).toStrictEqual((x.isMore(y) && y.isMore(z)) || x.isMore(z));
					}),
				);
			});

			it("should be the dual of isLess", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.isMore(y)).toStrictEqual(y.isLess(x));
					}),
				);
			});
		});

		describe("isNotMore", () => {
			it("should agree with isLess or isSame", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.isNotMore(y)).toStrictEqual(x.isLess(y) || x.isSame(y));
					}),
				);
			});
		});

		describe("compare", () => {
			it("should agree with isSame", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.compare(y).filter((ordering) => ordering === "=")).toStrictEqual(
							x.isSame(y) ? new Some("=") : None.instance,
						);
					}),
				);
			});

			it("should agree with isLess", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.compare(y).filter((ordering) => ordering === "<")).toStrictEqual(
							x.isLess(y) ? new Some("<") : None.instance,
						);
					}),
				);
			});

			it("should agree with isMore", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.compare(y).filter((ordering) => ordering === ">")).toStrictEqual(
							x.isMore(y) ? new Some(">") : None.instance,
						);
					}),
				);
			});
		});
	});
};

const testTotalOrder = <A extends TotalOrder<A>>(name: string, value: fc.Arbitrary<A>) => {
	testPartialOrder(name, value);

	describe(`TotalOrder<${name}>`, () => {
		describe("max", () => {
			it("should agree with compare", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.max(y)).toStrictEqual(
							x
								.compare(y)
								.map((ordering) => (ordering === "<" ? y : x))
								.extractSome(x.max(y)),
						);
					}),
				);
			});
		});

		describe("min", () => {
			it("should agree with compare", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, (x: A, y: A) => {
						expect(x.min(y)).toStrictEqual(
							x
								.compare(y)
								.map((ordering) => (ordering === ">" ? y : x))
								.extractSome(x.min(y)),
						);
					}),
				);
			});
		});

		describe("clamp", () => {
			it("should agree with min and max", () => {
				expect.assertions(100);

				fc.assert(
					fc.property(value, value, value, (value: A, lower: A, upper: A) => {
						expect(value.clamp(lower, upper)).toStrictEqual(value.max(lower).min(upper));
					}),
				);
			});
		});
	});
};

class Unknown implements PartialOrder<Unknown> {
	public constructor(public readonly value: unknown) {}

	public static of(value: unknown): Unknown {
		return new Unknown(value);
	}

	public isSame(this: Unknown, that: Unknown): boolean {
		return Object.is(this.value, that.value);
	}

	public isNotSame(this: Unknown, that: Unknown): boolean {
		return !Object.is(this.value, that.value);
	}

	public isLess(): boolean {
		return false;
	}

	public isNotLess(this: Unknown, that: Unknown): boolean {
		return Object.is(this.value, that.value);
	}

	public isMore(): boolean {
		return false;
	}

	public isNotMore(this: Unknown, that: Unknown): boolean {
		return Object.is(this.value, that.value);
	}

	public compare(this: Unknown, that: Unknown): Option<Ordering> {
		return Object.is(this.value, that.value) ? new Some("=") : None.instance;
	}
}

testPartialOrder("Unknown", fc.anything().map(Unknown.of));
testTotalOrder("Text", text);
testTotalOrder("Double", double);
testTotalOrder("Integer", integer);
testTotalOrder("Bool", bool);
testTotalOrder("DateTime", datetime);
testTotalOrder("Option<Double>", option(double));
testTotalOrder("Result<Double, DateTime>", result(double, datetime));
testTotalOrder("Pair<Double, DateTime>", pair(double, datetime));
