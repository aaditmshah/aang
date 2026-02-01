import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import type { Option } from "../src/option.js";
import type { Result } from "../src/result.js";
import type { Task } from "../src/task.js";

import { id } from "../src/miscellaneous.js";
import { None, Some } from "../src/option.js";
import { Pair } from "../src/pair.js";
import { none, option, pair, result, task } from "./arbitraries.js";
import { collatz, spawn } from "./utils.js";

const toStringSome = <A>(a: A): void => {
	try {
		expect(new Some(a).toString()).toStrictEqual(`Some(${String(a)})`);
	} catch (error) {
		expect(error).toBeInstanceOf(TypeError);
	}
};

const toStringNone = (u: None): void => {
	expect(u.toString()).toStrictEqual("None");
};

const foldEquivalence = <A, B>(u: Option<A>, f: (a: A) => B, b: B): void => {
	expect(u.fold(f, b)).toStrictEqual(u.isSome ? f(u.value) : b);
};

const mapIdentity = <A>(u: Option<A>): void => {
	expect(u.map(id)).toStrictEqual(u);
};

const replaceDefinition = <A, B>(u: Option<A>, b: B): void => {
	expect(u.replace(b)).toStrictEqual(u.map(() => b));
};

const andLeftIdentity = <A>(v: Option<A>): void => {
	expect(new Some(undefined).and(v)).toStrictEqual(v.map((y) => new Pair(undefined, y)));
};

const andRightIdentity = <A>(u: Option<A>): void => {
	expect(u.and(new Some(undefined))).toStrictEqual(u.map((x) => new Pair(x, undefined)));
};

const andAssociativity = <A, B, C>(u: Option<A>, v: Option<B>, w: Option<C>): void => {
	expect(u.and(v.and(w)).map((x) => x.associateLeft())).toStrictEqual(u.and(v).and(w));
};

const andLeftAnnihilation = <A>(v: Option<A>): void => {
	expect(None.instance.and(v)).toStrictEqual(None.instance);
};

const andRightAnnihilation = <A>(u: Option<A>): void => {
	expect(u.and(None.instance)).toStrictEqual(None.instance);
};

const andThenDefinition = <A, B>(u: Option<A>, v: Option<B>): void => {
	expect(u.andThen(v)).toStrictEqual(u.and(v).map((x) => x.snd));
};

const andWhenDefinition = <A, B>(u: Option<A>, v: Option<B>): void => {
	expect(u.andWhen(v)).toStrictEqual(u.and(v).map((x) => x.fst));
};

const orLeftIdentity = <A>(v: Option<A>): void => {
	expect(None.instance.or(v)).toStrictEqual(v);
};

const orRightIdentity = <A>(u: Option<A>): void => {
	expect(u.or(None.instance)).toStrictEqual(u);
};

const orAssociativity = <A>(u: Option<A>, v: Option<A>, w: Option<A>): void => {
	expect(u.or(v.or(w))).toStrictEqual(u.or(v).or(w));
};

const orLeftDistributivity = <A, B>(u: Option<A>, v: Option<A>, w: Option<B>): void => {
	expect(u.or(v).and(w)).toStrictEqual(u.and(w).or(v.and(w)));
};

const orRightDistributivity = <A, B>(u: Option<A>, v: Option<B>, w: Option<B>): void => {
	expect(u.and(v.or(w))).toStrictEqual(u.and(v).or(u.and(w)));
};

const flatMapLeftIdentity = <A, B>(a: A, k: (a: A) => Option<B>): void => {
	expect(new Some(a).flatMap(k)).toStrictEqual(k(a));
};

const flatMapRightIdentity = <A>(m: Option<A>): void => {
	expect(m.flatMap(Some.of)).toStrictEqual(m);
};

const flatMapAssociativity = <A, B, C>(
	m: Option<A>,
	k: (a: A) => Option<B>,
	h: (b: B) => Option<C>,
): void => {
	expect(m.flatMap((a) => k(a).flatMap(h))).toStrictEqual(m.flatMap(k).flatMap(h));
};

const flattenDefinition = <A>(u: Option<Option<A>>): void => {
	expect(u.flatten()).toStrictEqual(u.flatMap(id));
};

const flatMapUntilEquivalence = <A, B>(m: Option<A>, k: (a: A) => Option<Result<B, A>>): void => {
	const f = (x: Result<B, A>): Option<B> => (x.isOkay ? new Some(x.value) : k(x.value).flatMap(f));
	expect(m.flatMapUntil(k)).toStrictEqual(m.flatMap(k).flatMap(f));
};

const filterDistributivity = <A>(
	m: Option<A>,
	p: (a: A) => boolean,
	q: (a: A) => boolean,
): void => {
	expect(m.filter(p).filter(q)).toStrictEqual(m.filter((a) => p(a) && q(a)));
};

const filterIdentity = <A>(m: Option<A>): void => {
	expect(m.filter(() => true)).toStrictEqual(m);
};

const filterAnnihilation = <A>(m: Option<A>): void => {
	expect(m.filter(() => false)).toStrictEqual(None.instance);
};

const isSomeAndDefinition = <A>(m: Option<A>, p: (a: A) => boolean): void => {
	expect(m.isSomeAnd(p)).toStrictEqual(m.filter(p).isSome);
};

const isNoneOrDefinition = <A>(m: Option<A>, p: (a: A) => boolean): void => {
	expect(m.isNoneOr(p)).toStrictEqual(m.filter((a) => !p(a)).isNone);
};

const unzipWithNone = <A, B, C>(f: (a: A) => Pair<B, C>): void => {
	expect(None.instance.unzipWith(f)).toStrictEqual(Pair.from(None.instance));
};

const unzipWithSome = <A, B, C>(a: A, f: (a: A) => Pair<B, C>): void => {
	expect(new Some(a).unzipWith(f)).toStrictEqual(f(a).map(Some.of, Some.of));
};

const unzipDefinition = <A, B>(u: Option<Pair<A, B>>): void => {
	expect(u.unzip()).toStrictEqual(u.unzipWith(id));
};

const transposeMapOkayInverse = <A, E>(m: Option<Result<A, E>>): void => {
	expect(m.transposeMapOkay(id).transposeMapOkay(id)).toStrictEqual(m);
};

const transposeMapFailInverse = <A, E>(m: Option<Result<A, E>>): void => {
	expect(m.transposeMapFail(id).transposeMapFail(id)).toStrictEqual(m);
};

const transposeOkayInverse = <A, E>(m: Option<Result<A, E>>): void => {
	expect(m.transposeOkay().transposeOkay()).toStrictEqual(m);
};

const transposeFailInverse = <A, E>(m: Option<Result<A, E>>): void => {
	expect(m.transposeFail().transposeFail()).toStrictEqual(m);
};

const exchangeOkayDefinition = async <A, E>(m: Option<Task<A, E>>): Promise<void> => {
	expect(await spawn(m.exchangeOkay())).toStrictEqual(await spawn(m.exchangeMapOkay(id)));
};

const exchangeFailDefinition = async <A, E>(m: Option<Task<A, E>>): Promise<void> => {
	expect(await spawn(m.exchangeFail())).toStrictEqual(await spawn(m.exchangeMapFail(id)));
};

const extractSomeFromSome = <A>(a: A, x: A): void => {
	expect(new Some(a).extractSome(x)).toStrictEqual(a);
};

const extractSomeFromNone = <A>(x: A): void => {
	expect(None.instance.extractSome(x)).toStrictEqual(x);
};

const extractMapSomeDefinition = <A>(m: Option<A>, a: A): void => {
	expect(m.extractMapSome(() => a)).toStrictEqual(m.extractSome(a));
};

const toResultOkayInverse = <E, A>(m: Option<A>, x: E): void => {
	expect(m.toResultOkay(x).toOptionOkay()).toStrictEqual(m);
};

const toResultFailInverse = <E, A>(m: Option<E>, x: A): void => {
	expect(m.toResultFail(x).toOptionFail()).toStrictEqual(m);
};

const valuesSome = <A>(a: A): void => {
	expect([...new Some(a).values()]).toStrictEqual([a]);
};

const valuesNone = (m: None): void => {
	expect([...m.values()]).toStrictEqual([]);
};

const fromValidDefinition = <A>(a: A, f: (a: A) => boolean): void => {
	expect(Some.fromValid(a, f)).toStrictEqual(f(a) ? new Some(a) : None.instance);
};

const fromNullishDefinition = <A>(a: A): void => {
	expect(None.fromNullish(a)).toStrictEqual(a == null ? None.instance : new Some(a));
};

const fromFalsyDefinition = <A>(a: A): void => {
	expect(None.fromFalsy(a)).toStrictEqual(a ? new Some(a) : None.instance);
};

describe("Option", () => {
	describe("toString", () => {
		it("should convert Some to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), toStringSome));
		});

		it("should convert None to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(none, toStringNone));
		});
	});

	describe("fold", () => {
		it("should fold the Option", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), fc.func(fc.anything()), fc.anything(), foldEquivalence),
			);
		});
	});

	describe("map", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), mapIdentity));
		});
	});

	describe("replace", () => {
		it("should agree with map", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), fc.anything(), replaceDefinition));
		});
	});

	describe("and", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), andLeftIdentity));
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), andRightIdentity));
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					option(fc.anything()),
					option(fc.anything()),
					andAssociativity,
				),
			);
		});

		it("should have a left annihilator", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), andLeftAnnihilation));
		});

		it("should have a right annihilator", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), andRightAnnihilation));
		});
	});

	describe("andThen", () => {
		it("should agree with and", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), option(fc.anything()), andThenDefinition));
		});
	});

	describe("andWhen", () => {
		it("should agree with and", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), option(fc.anything()), andWhenDefinition));
		});
	});

	describe("or", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), orLeftIdentity));
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), orRightIdentity));
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					option(fc.anything()),
					option(fc.anything()),
					orAssociativity,
				),
			);
		});

		it("should be left distributive", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					option(fc.anything()),
					option(fc.anything()),
					orLeftDistributivity,
				),
			);
		});

		it("should be right distributive", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					option(fc.anything()),
					option(fc.anything()),
					orRightDistributivity,
				),
			);
		});
	});

	describe("flatMap", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), fc.func(option(fc.anything())), flatMapLeftIdentity));
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), flatMapRightIdentity));
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					fc.func(option(fc.anything())),
					fc.func(option(fc.anything())),
					flatMapAssociativity,
				),
			);
		});
	});

	describe("flatten", () => {
		it("should agree with flatMap", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(option(fc.anything())), flattenDefinition));
		});
	});

	describe("flatMapUntil", () => {
		it("should be equivalent to multiple flatMap calls", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.integer({ min: 1 })),
					fc.constant((n: number): Option<Result<number, number>> => new Some(collatz(n))),
					flatMapUntilEquivalence,
				),
			);
		});
	});

	describe("filter", () => {
		it("should be distributive", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					fc.func(fc.boolean()),
					fc.func(fc.boolean()),
					filterDistributivity,
				),
			);
		});

		it("should have an identity input", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), filterIdentity));
		});

		it("should have an annihilating input", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), filterAnnihilation));
		});
	});

	describe("isSomeAnd", () => {
		it("should agree with filter", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), fc.func(fc.boolean()), isSomeAndDefinition));
		});
	});

	describe("isNoneOr", () => {
		it("should agree with filter", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), fc.func(fc.boolean()), isNoneOrDefinition));
		});
	});

	describe("unzipWith", () => {
		it("should unzip None", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.func(pair(fc.anything(), fc.anything())), unzipWithNone));
		});

		it("should unzip Some", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), fc.func(pair(fc.anything(), fc.anything())), unzipWithSome),
			);
		});
	});

	describe("unzip", () => {
		it("should agree with unzipWith", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(pair(fc.anything(), fc.anything())), unzipDefinition));
		});
	});

	describe("transposeMapOkay", () => {
		it("should be inverted by Result#transposeMapOkay", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(result(fc.anything(), fc.anything())), transposeMapOkayInverse));
		});
	});

	describe("transposeMapFail", () => {
		it("should be inverted by Result#transposeMapFail", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(result(fc.anything(), fc.anything())), transposeMapFailInverse));
		});
	});

	describe("transposeOkay", () => {
		it("should be inverted by Result#transposeOkay", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(result(fc.anything(), fc.anything())), transposeOkayInverse));
		});
	});

	describe("transposeFail", () => {
		it("should be inverted by Result#transposeFail", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(result(fc.anything(), fc.anything())), transposeFailInverse));
		});
	});

	describe("exchangeOkay", () => {
		it("should agree with exchangeMapOkay", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(option(task(fc.anything(), fc.anything())), exchangeOkayDefinition),
			);
		});
	});

	describe("exchangeFail", () => {
		it("should agree with exchangeMapFail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(option(task(fc.anything(), fc.anything())), exchangeFailDefinition),
			);
		});
	});

	describe("extractSome", () => {
		it("should extract the value from Some", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), fc.anything(), extractSomeFromSome));
		});

		it("should return the default value for None", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), extractSomeFromNone));
		});
	});

	describe("extractMapSome", () => {
		it("should agree with extractSome", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), fc.anything(), extractMapSomeDefinition));
		});
	});

	describe("toResultOkay", () => {
		it("should be inverted by toOptionOkay", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), fc.anything(), toResultOkayInverse));
		});
	});

	describe("toResultFail", () => {
		it("should be inverted by toOptionFail", () => {
			expect.assertions(100);

			fc.assert(fc.property(option(fc.anything()), fc.anything(), toResultFailInverse));
		});
	});

	describe("values", () => {
		it("should iterate over the value of Some", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), valuesSome));
		});

		it("should not iterate over None", () => {
			expect.assertions(100);

			fc.assert(fc.property(none, valuesNone));
		});
	});
});

describe("Some", () => {
	describe("fromValid", () => {
		it("should agree with the predicate", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), fc.func(fc.boolean()), fromValidDefinition));
		});
	});
});

describe("None", () => {
	describe("fromNullish", () => {
		it("should convert any value into a non-nullish option", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), fromNullishDefinition));
		});
	});

	describe("fromFalsy", () => {
		it("should convert any value into a non-falsy option", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), fromFalsyDefinition));
		});
	});
});
