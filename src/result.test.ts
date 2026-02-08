import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Option } from "./option.js";
import type { Result } from "./result.js";

import { option, pair, result, stringable, task } from "./arbitraries.test-util.js";
import { id } from "./miscellaneous.js";
import { Some } from "./option.js";
import { Pair } from "./pair.js";
import { Fail, Okay } from "./result.js";
import { Task } from "./task.js";
import { collatz, hotpo, isPowerOfTwo, spawn } from "./utils.test-util.js";

describe("Result", () => {
	describe("toString", () => {
		it("should convert Okay to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(stringable, <A>(a: A) => {
					expect(new Okay(a).toString()).toStrictEqual(`Okay(${String(a)})`);
				}),
			);
		});

		it("should convert Fail to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(stringable, <E>(x: E) => {
					expect(new Fail(x).toString()).toStrictEqual(`Fail(${String(x)})`);
				}),
			);
		});
	});

	describe("fold", () => {
		it("should fold the Result", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(fc.anything()),
					fc.func(fc.anything()),
					<A, E, T>(u: Result<A, E>, f: (a: A) => T, g: (x: E) => T) => {
						expect(u.fold(f, g)).toStrictEqual(u.isOkay ? f(u.value) : g(u.value));
					},
				),
			);
		});
	});

	describe("map", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(u: Result<A, E>) => {
					expect(u.map(id, id)).toStrictEqual(u);
				}),
			);
		});
	});

	describe("mapOkay", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(u: Result<A, E>) => {
					expect(u.mapOkay(id)).toStrictEqual(u);
				}),
			);
		});
	});

	describe("mapFail", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(u: Result<A, E>) => {
					expect(u.mapFail(id)).toStrictEqual(u);
				}),
			);
		});
	});

	describe("replace", () => {
		it("should agree with map", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.anything(),
					fc.anything(),
					<A, B, E, F>(u: Result<A, E>, b: B, f: F) => {
						expect(u.replace(b, f)).toStrictEqual(
							u.map(
								() => b,
								() => f,
							),
						);
					},
				),
			);
		});
	});

	describe("replaceOkay", () => {
		it("should agree with mapOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.anything(),
					<A, B, E>(u: Result<A, E>, b: B) => {
						expect(u.replaceOkay(b)).toStrictEqual(u.mapOkay(() => b));
					},
				),
			);
		});
	});

	describe("replaceFail", () => {
		it("should agree with mapFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.anything(),
					<A, E, F>(u: Result<A, E>, f: F) => {
						expect(u.replaceFail(f)).toStrictEqual(u.mapFail(() => f));
					},
				),
			);
		});
	});

	describe("and", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(v: Result<A, E>) => {
					expect(new Okay(undefined).and(v)).toStrictEqual(
						v.mapOkay((y) => new Pair(undefined, y)),
					);
				}),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(u: Result<A, E>) => {
					expect(u.and(new Okay(undefined))).toStrictEqual(
						u.mapOkay((x) => new Pair(x, undefined)),
					);
				}),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					result(fc.anything(), fc.anything()),
					result(fc.anything(), fc.anything()),
					<A, B, C, E>(u: Result<A, E>, v: Result<B, E>, w: Result<C, E>) => {
						expect(u.and(v.and(w)).mapOkay((x) => x.associateLeft())).toStrictEqual(
							u.and(v).and(w),
						);
					},
				),
			);
		});

		it("should have a left annihilator", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(v: Result<A, E>) => {
					expect(new Fail(undefined).and(v)).toStrictEqual(new Fail(undefined));
				}),
			);
		});
	});

	describe("andThen", () => {
		it("should agree with and", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					result(fc.anything(), fc.anything()),
					<A, B, E>(u: Result<A, E>, v: Result<B, E>) => {
						expect(u.andThen(v)).toStrictEqual(u.and(v).mapOkay((x) => x.snd));
					},
				),
			);
		});
	});

	describe("andWhen", () => {
		it("should agree with and", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					result(fc.anything(), fc.anything()),
					<A, B, E>(u: Result<A, E>, v: Result<B, E>) => {
						expect(u.andWhen(v)).toStrictEqual(u.and(v).mapOkay((x) => x.fst));
					},
				),
			);
		});
	});

	describe("or", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(v: Result<A, E>) => {
					expect(new Fail(undefined).or(v)).toStrictEqual(v.mapFail((y) => new Pair(undefined, y)));
				}),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(u: Result<A, E>) => {
					expect(u.or(new Fail(undefined))).toStrictEqual(u.mapFail((x) => new Pair(x, undefined)));
				}),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					result(fc.anything(), fc.anything()),
					result(fc.anything(), fc.anything()),
					<A, E, F, G>(u: Result<A, E>, v: Result<A, F>, w: Result<A, G>) => {
						expect(u.or(v.or(w)).mapFail((x) => x.associateLeft())).toStrictEqual(u.or(v).or(w));
					},
				),
			);
		});

		it("should have a left annihilator", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(v: Result<A, E>) => {
					expect(new Okay(undefined).or(v)).toStrictEqual(new Okay(undefined));
				}),
			);
		});
	});

	describe("orElse", () => {
		it("should agree with or", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					result(fc.anything(), fc.anything()),
					<A, E, F>(u: Result<A, E>, v: Result<A, F>) => {
						expect(u.orElse(v)).toStrictEqual(u.or(v).mapFail((x) => x.snd));
					},
				),
			);
		});
	});

	describe("orErst", () => {
		it("should agree with or", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					result(fc.anything(), fc.anything()),
					<A, E, F>(u: Result<A, E>, v: Result<A, F>) => {
						expect(u.orErst(v)).toStrictEqual(u.or(v).mapFail((x) => x.fst));
					},
				),
			);
		});
	});

	describe("flatMap", () => {
		it("should have a left okay identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					fc.anything(),
					fc.func(result(fc.anything(), fc.anything())),
					<A, B, E>(a: A, k: (a: A) => Result<B, E>) => {
						expect(new Okay(a).flatMap<A, B, E, E>(k, Fail.of)).toStrictEqual(k(a));
					},
				),
			);
		});

		it("should have a left fail identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					fc.anything(),
					fc.func(result(fc.anything(), fc.anything())),
					<A, E, F>(x: E, k: (x: E) => Result<A, F>) => {
						expect(new Fail(x).flatMap<A, A, E, F>(Okay.of, k)).toStrictEqual(k(x));
					},
				),
			);
		});

		it("should have a right okay and a right fail identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(m: Result<A, E>) => {
					expect(m.flatMap(Okay.of, Fail.of)).toStrictEqual(m);
				}),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					fc.func(result(fc.anything(), fc.anything())),
					fc.func(result(fc.anything(), fc.anything())),
					fc.func(result(fc.anything(), fc.anything())),
					<A, B, C, E, F, G>(
						m: Result<A, E>,
						k: (a: A) => Result<B, F>,
						c: (x: E) => Result<B, F>,
						h: (b: B) => Result<C, G>,
						g: (f: F) => Result<C, G>,
					) => {
						expect(
							m.flatMap(
								(a) => k(a).flatMap(h, g),
								(x) => c(x).flatMap(h, g),
							),
						).toStrictEqual(m.flatMap(k, c).flatMap(h, g));
					},
				),
			);
		});
	});

	describe("flatMapOkay", () => {
		it("should agree with flatMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					<A, B, E>(m: Result<A, E>, k: (a: A) => Result<B, E>) => {
						expect(m.flatMapOkay(k)).toStrictEqual(m.flatMap(k, Fail.of));
					},
				),
			);
		});
	});

	describe("flatMapFail", () => {
		it("should agree with flatMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					<A, E, F>(m: Result<A, E>, k: (x: E) => Result<A, F>) => {
						expect(m.flatMapFail(k)).toStrictEqual(m.flatMap(Okay.of, k));
					},
				),
			);
		});
	});

	describe("flattenOkay", () => {
		it("should agree with flatMapOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(result(fc.anything(), fc.anything()), fc.anything()),
					<A, E>(m: Result<Result<A, E>, E>) => {
						expect(m.flattenOkay()).toStrictEqual(m.flatMapOkay(id));
					},
				),
			);
		});
	});

	describe("flattenFail", () => {
		it("should agree with flatMapFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), result(fc.anything(), fc.anything())),
					<A, E>(m: Result<A, Result<A, E>>) => {
						expect(m.flattenFail()).toStrictEqual(m.flatMapFail(id));
					},
				),
			);
		});
	});

	describe("flatMapUntil", () => {
		it("should be equivalent to multiple flatMap calls", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.integer({ min: 1 }), fc.integer({ min: 1 })),
					fc.constant((n: number) => new Okay(collatz(n))),
					fc.constant((n: number) => new Fail(collatz(n))),
					<A, B, E, F>(
						m: Result<A, E>,
						k: (a: A) => Result<Result<B, A>, Result<F, E>>,
						c: (x: E) => Result<Result<B, A>, Result<F, E>>,
					) => {
						const f = (x: Result<B, A>): Result<B, F> => (x.isOkay ? x : k(x.value).flatMap(f, g));
						const g = (y: Result<F, E>): Result<B, F> =>
							y.isOkay ? new Fail(y.value) : c(y.value).flatMap(f, g);
						expect(m.flatMapUntil(k, c)).toStrictEqual(m.flatMap(k, c).flatMap(f, g));
					},
				),
			);
		});
	});

	describe("flatMapOkayUntil", () => {
		it("should be equivalent to multiple flatMapOkay calls", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.integer({ min: 1 }), fc.anything()),
					fc.constant((n: number) => new Okay(collatz(n))),
					<A, B, E>(m: Result<A, E>, k: (a: A) => Result<Result<B, A>, E>) => {
						const f = (x: Result<B, A>): Result<B, E> => (x.isOkay ? x : k(x.value).flatMapOkay(f));
						expect(m.flatMapOkayUntil(k)).toStrictEqual(m.flatMapOkay(k).flatMapOkay(f));
					},
				),
			);
		});
	});

	describe("flatMapFailUntil", () => {
		it("should be equivalent to multiple flatMapFail calls", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.integer({ min: 1 })),
					fc.constant((n: number) => new Fail(collatz(n))),
					<A, E, F>(m: Result<A, E>, c: (x: E) => Result<A, Result<F, E>>) => {
						const g = (y: Result<F, E>): Result<A, F> =>
							y.isOkay ? new Fail(y.value) : c(y.value).flatMapFail(g);
						expect(m.flatMapFailUntil(c)).toStrictEqual(m.flatMapFail(c).flatMapFail(g));
					},
				),
			);
		});
	});

	describe("commute", () => {
		it("should be its own inverse", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(m: Result<A, E>) => {
					expect(m.commute().commute()).toStrictEqual(m);
				}),
			);
		});
	});

	describe("isOkayAnd", () => {
		it("should agree with isSomeAnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(fc.boolean()),
					<A, E>(m: Result<A, E>, p: (a: A) => boolean) => {
						expect(m.isOkayAnd(p)).toStrictEqual(m.toOptionOkay().isSomeAnd(p));
					},
				),
			);
		});
	});

	describe("isFailAnd", () => {
		it("should agree with isSomeAnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(fc.boolean()),
					<A, E>(m: Result<A, E>, p: (x: E) => boolean) => {
						expect(m.isFailAnd(p)).toStrictEqual(m.toOptionFail().isSomeAnd(p));
					},
				),
			);
		});
	});

	describe("isOkayOr", () => {
		it("should agree with isNoneOr", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(fc.boolean()),
					<A, E>(m: Result<A, E>, p: (x: E) => boolean) => {
						expect(m.isOkayOr(p)).toStrictEqual(m.toOptionFail().isNoneOr(p));
					},
				),
			);
		});
	});

	describe("isFailOr", () => {
		it("should agree with isNoneOr", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(fc.boolean()),
					<A, E>(m: Result<A, E>, p: (a: A) => boolean) => {
						expect(m.isFailOr(p)).toStrictEqual(m.toOptionOkay().isNoneOr(p));
					},
				),
			);
		});
	});

	describe("transposeMapOkay", () => {
		it("should agree with transposeMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(option(fc.anything())),
					<A, B, E>(m: Result<A, E>, f: (a: A) => Option<B>) => {
						expect(m.transposeMapOkay(f)).toStrictEqual(m.transposeMap(f, Some.of));
					},
				),
			);
		});
	});

	describe("transposeMapFail", () => {
		it("should agree with transposeMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(option(fc.anything())),
					<A, E, F>(m: Result<A, E>, g: (x: E) => Option<F>) => {
						expect(m.transposeMapFail(g)).toStrictEqual(m.transposeMap(Some.of, g));
					},
				),
			);
		});
	});

	describe("transpose", () => {
		it("should agree with transposeMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(option(fc.anything()), option(fc.anything())),
					<A, E>(m: Result<Option<A>, Option<E>>) => {
						expect(m.transpose()).toStrictEqual(m.transposeMap(id, id));
					},
				),
			);
		});
	});

	describe("transposeOkay", () => {
		it("should agree with transposeMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(option(fc.anything()), fc.anything()),
					<A, E>(m: Result<Option<A>, E>) => {
						expect(m.transposeOkay()).toStrictEqual(m.transposeMap(id, Some.of));
					},
				),
			);
		});
	});

	describe("transposeFail", () => {
		it("should agree with transposeMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), option(fc.anything())),
					<A, E>(m: Result<A, Option<E>>) => {
						expect(m.transposeFail()).toStrictEqual(m.transposeMap(Some.of, id));
					},
				),
			);
		});
	});

	describe("unzipWithOkay", () => {
		it("should agree with unzipWith", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(pair(fc.anything(), fc.anything())),
					<A, B, C, E>(m: Result<A, E>, f: (a: A) => Pair<B, C>) => {
						expect(m.unzipWithOkay(f)).toStrictEqual(m.unzipWith(f, Pair.from));
					},
				),
			);
		});
	});

	describe("unzipWithFail", () => {
		it("should agree with unzipWith", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(pair(fc.anything(), fc.anything())),
					<A, E, F, G>(m: Result<A, E>, g: (x: E) => Pair<F, G>) => {
						expect(m.unzipWithFail(g)).toStrictEqual(m.unzipWith(Pair.from, g));
					},
				),
			);
		});
	});

	describe("unzip", () => {
		it("should agree with unzipWith", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(pair(fc.anything(), fc.anything()), pair(fc.anything(), fc.anything())),
					<A, B, E, F>(m: Result<Pair<A, B>, Pair<E, F>>) => {
						expect(m.unzip()).toStrictEqual(m.unzipWith(id, id));
					},
				),
			);
		});
	});

	describe("unzipOkay", () => {
		it("should agree with unzipWith", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(pair(fc.anything(), fc.anything()), fc.anything()),
					<A, B, E>(m: Result<Pair<A, B>, E>) => {
						expect(m.unzipOkay()).toStrictEqual(m.unzipWith(id, Pair.from));
					},
				),
			);
		});
	});

	describe("unzipFail", () => {
		it("should agree with unzipWith", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), pair(fc.anything(), fc.anything())),
					<A, E, F>(m: Result<A, Pair<E, F>>) => {
						expect(m.unzipFail()).toStrictEqual(m.unzipWith(Pair.from, id));
					},
				),
			);
		});
	});

	describe("collectFst", () => {
		it("should agree with collectMapFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(pair(fc.anything(), fc.anything()), pair(fc.anything(), fc.anything())),
					<A, B, C>(m: Result<Pair<A, C>, Pair<B, C>>) => {
						expect(m.collectFst()).toStrictEqual(m.collectMapFst(id, id));
					},
				),
			);
		});
	});

	describe("collectSnd", () => {
		it("should agree with collectMapSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(pair(fc.anything(), fc.anything()), pair(fc.anything(), fc.anything())),
					<A, B, C>(m: Result<Pair<A, B>, Pair<A, C>>) => {
						expect(m.collectSnd()).toStrictEqual(m.collectMapSnd(id, id));
					},
				),
			);
		});
	});

	describe("exchangeMapFail", () => {
		it("should agree with collectMapOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					<A, B, E, F>(m: Result<A, E>, f: (a: A) => Result<B, F>) => {
						expect(m.exchangeMapFail(f)).toStrictEqual(m.collectMapOkay(f, Okay.of));
					},
				),
			);
		});
	});

	describe("associateMapLeft", () => {
		it("should agree with collectMapOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					<Y, A, B, C>(m: Result<A, Y>, g: (x: Y) => Result<B, C>) => {
						expect(m.associateMapLeft(g)).toStrictEqual(m.collectMapOkay(Okay.of, g));
					},
				),
			);
		});
	});

	describe("collectOkay", () => {
		it("should agree with collectMapOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(result(fc.anything(), fc.anything()), result(fc.anything(), fc.anything())),
					<A, B, E>(m: Result<Result<A, E>, Result<B, E>>) => {
						expect(m.collectOkay()).toStrictEqual(m.collectMapOkay(id, id));
					},
				),
			);
		});
	});

	describe("exchangeFail", () => {
		it("should agree with collectMapOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(result(fc.anything(), fc.anything()), fc.anything()),
					<A, E, F>(m: Result<Result<A, E>, F>) => {
						expect(m.exchangeFail()).toStrictEqual(m.collectMapOkay(id, Okay.of));
					},
				),
			);
		});

		it("should be its own inverse", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(result(fc.anything(), fc.anything()), fc.anything()),
					<A, E, F>(m: Result<Result<A, E>, F>) => {
						expect(m.exchangeFail().exchangeFail()).toStrictEqual(m);
					},
				),
			);
		});
	});

	describe("associateLeft", () => {
		it("should agree with collectMapOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), result(fc.anything(), fc.anything())),
					<A, B, C>(m: Result<A, Result<B, C>>) => {
						expect(m.associateLeft()).toStrictEqual(m.collectMapOkay(Okay.of, id));
					},
				),
			);
		});

		it("should be the inverse of associateRight", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(result(fc.anything(), fc.anything()), fc.anything()),
					<A, B, C>(m: Result<Result<A, B>, C>) => {
						expect(m.associateRight().associateLeft()).toStrictEqual(m);
					},
				),
			);
		});
	});

	describe("exchangeMapOkay", () => {
		it("should agree with collectMapFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					<A, B, E, F>(m: Result<A, E>, g: (x: E) => Result<B, F>) => {
						expect(m.exchangeMapOkay(g)).toStrictEqual(m.collectMapFail(Fail.of, g));
					},
				),
			);
		});
	});

	describe("associateMapRight", () => {
		it("should agree with collectMapFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					<X, A, B, C>(m: Result<X, C>, f: (x: X) => Result<A, B>) => {
						expect(m.associateMapRight(f)).toStrictEqual(m.collectMapFail(f, Fail.of));
					},
				),
			);
		});
	});

	describe("collectFail", () => {
		it("should agree with collectMapFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(result(fc.anything(), fc.anything()), result(fc.anything(), fc.anything())),
					<A, E, F>(m: Result<Result<A, E>, Result<A, F>>) => {
						expect(m.collectFail()).toStrictEqual(m.collectMapFail(id, id));
					},
				),
			);
		});
	});

	describe("exchangeOkay", () => {
		it("should agree with collectMapFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), result(fc.anything(), fc.anything())),
					<A, B, E>(m: Result<A, Result<B, E>>) => {
						expect(m.exchangeOkay()).toStrictEqual(m.collectMapFail(Fail.of, id));
					},
				),
			);
		});

		it("should be its own inverse", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), result(fc.anything(), fc.anything())),
					<A, B, E>(m: Result<A, Result<B, E>>) => {
						expect(m.exchangeOkay().exchangeOkay()).toStrictEqual(m);
					},
				),
			);
		});
	});

	describe("associateRight", () => {
		it("should agree with collectMapFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(result(fc.anything(), fc.anything()), fc.anything()),
					<A, B, C>(m: Result<Result<A, B>, C>) => {
						expect(m.associateRight()).toStrictEqual(m.collectMapFail(id, Fail.of));
					},
				),
			);
		});

		it("should be the inverse of associateLeft", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), result(fc.anything(), fc.anything())),
					<A, B, C>(m: Result<A, Result<B, C>>) => {
						expect(m.associateLeft().associateRight()).toStrictEqual(m);
					},
				),
			);
		});
	});

	describe("distributeMap", () => {
		it("should agree with distribute", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(result(fc.anything(), fc.anything()), result(fc.anything(), fc.anything())),
					<A, B, E, F>(m: Result<Result<A, B>, Result<E, F>>) => {
						expect(m.distributeMap(id, id)).toStrictEqual(m.distribute());
					},
				),
			);
		});
	});

	describe("distribute", () => {
		it("should be its own inverse", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(result(fc.anything(), fc.anything()), result(fc.anything(), fc.anything())),
					<A, B, E, F>(m: Result<Result<A, B>, Result<E, F>>) => {
						expect(m.distribute().distribute()).toStrictEqual(m);
					},
				),
			);
		});
	});

	describe("swapMapFail", () => {
		it("should agree with gatherMapOkay", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					async <X, A, E, F>(m: Result<X, F>, f: (x: X) => Task<A, E>) => {
						expect(await spawn(m.swapMapFail(f))).toStrictEqual(
							await spawn(m.gatherMapOkay(f, Task.okay)),
						);
					},
				),
			);
		});
	});

	describe("groupMapLeft", () => {
		it("should agree with gatherMapOkay", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					async <Y, A, B, C>(m: Result<A, Y>, g: (y: Y) => Task<B, C>) => {
						expect(await spawn(m.groupMapLeft(g))).toStrictEqual(
							await spawn(m.gatherMapOkay(Task.okay, g)),
						);
					},
				),
			);
		});
	});

	describe("gatherOkay", () => {
		it("should agree with gatherMapOkay", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(task(fc.anything(), fc.anything()), task(fc.anything(), fc.anything())),
					async <A, B, E>(m: Result<Task<A, E>, Task<B, E>>) => {
						expect(await spawn(m.gatherOkay())).toStrictEqual(await spawn(m.gatherMapOkay(id, id)));
					},
				),
			);
		});
	});

	describe("swapFail", () => {
		it("should agree with gatherMapOkay", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(task(fc.anything(), fc.anything()), fc.anything()),
					async <A, E, F>(m: Result<Task<A, E>, F>) => {
						expect(await spawn(m.swapFail())).toStrictEqual(
							await spawn(m.gatherMapOkay(id, Task.okay)),
						);
					},
				),
			);
		});
	});

	describe("groupLeft", () => {
		it("should agree with gatherMapOkay", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(fc.anything(), task(fc.anything(), fc.anything())),
					async <A, B, C>(m: Result<A, Task<B, C>>) => {
						expect(await spawn(m.groupLeft())).toStrictEqual(
							await spawn(m.gatherMapOkay(Task.okay, id)),
						);
					},
				),
			);
		});
	});

	describe("swapMapOkay", () => {
		it("should agree with gatherMapFail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					async <Y, A, B, E>(m: Result<A, Y>, g: (y: Y) => Task<B, E>) => {
						expect(await spawn(m.swapMapOkay(g))).toStrictEqual(
							await spawn(m.gatherMapFail(Task.fail, g)),
						);
					},
				),
			);
		});
	});

	describe("groupMapRight", () => {
		it("should agree with gatherMapFail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					async <X, A, B, C>(m: Result<X, C>, f: (x: X) => Task<A, B>) => {
						expect(await spawn(m.groupMapRight(f))).toStrictEqual(
							await spawn(m.gatherMapFail(f, Task.fail)),
						);
					},
				),
			);
		});
	});

	describe("gatherFail", () => {
		it("should agree with gatherMapFail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(task(fc.anything(), fc.anything()), task(fc.anything(), fc.anything())),
					async <A, E, F>(m: Result<Task<A, E>, Task<A, F>>) => {
						expect(await spawn(m.gatherFail())).toStrictEqual(await spawn(m.gatherMapFail(id, id)));
					},
				),
			);
		});
	});

	describe("swapOkay", () => {
		it("should agree with gatherMapFail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(fc.anything(), task(fc.anything(), fc.anything())),
					async <A, B, E>(m: Result<A, Task<B, E>>) => {
						expect(await spawn(m.swapOkay())).toStrictEqual(
							await spawn(m.gatherMapFail(Task.fail, id)),
						);
					},
				),
			);
		});
	});

	describe("groupRight", () => {
		it("should agree with gatherMapFail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(task(fc.anything(), fc.anything()), fc.anything()),
					async <A, B, C>(m: Result<Task<A, B>, C>) => {
						expect(await spawn(m.groupRight())).toStrictEqual(
							await spawn(m.gatherMapFail(id, Task.fail)),
						);
					},
				),
			);
		});
	});

	describe("interchange", () => {
		it("should agree with interchangeMap", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(task(fc.anything(), fc.anything()), task(fc.anything(), fc.anything())),
					async <A, B, E, F>(m: Result<Task<A, B>, Task<E, F>>) => {
						expect(await spawn(m.interchange())).toStrictEqual(
							await spawn(m.interchangeMap(id, id)),
						);
					},
				),
			);
		});
	});

	describe("extractOkay", () => {
		it("should extract the value from Okay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), fc.anything(), <A>(a: A, x: A) => {
					expect(new Okay(a).extractOkay(x)).toStrictEqual(a);
				}),
			);
		});

		it("should return the default value for Fail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), fc.anything(), <A, E>(x: E, y: A) => {
					expect(new Fail(x).extractOkay(y)).toStrictEqual(y);
				}),
			);
		});
	});

	describe("extractFail", () => {
		it("should extract the value from Fail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), fc.anything(), <E>(x: E, y: E) => {
					expect(new Fail(x).extractFail(y)).toStrictEqual(x);
				}),
			);
		});

		it("should return the default value for Okay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), fc.anything(), <A, E>(a: A, x: E) => {
					expect(new Okay(a).extractFail(x)).toStrictEqual(x);
				}),
			);
		});
	});

	describe("extractMapOkay", () => {
		it("should agree with extractOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.anything(),
					<A, E>(m: Result<A, E>, a: A) => {
						expect(m.extractMapOkay(() => a)).toStrictEqual(m.extractOkay(a));
					},
				),
			);
		});
	});

	describe("extractMapFail", () => {
		it("should agree with extractFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.anything(),
					<A, E>(m: Result<A, E>, x: E) => {
						expect(m.extractMapFail(() => x)).toStrictEqual(m.extractFail(x));
					},
				),
			);
		});
	});

	describe("toTask", () => {
		it("should agree with Task.okay and Task.fail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(result(fc.anything(), fc.anything()), async <A, E>(m: Result<A, E>) => {
					expect(await spawn(m.toTask())).toStrictEqual(
						await spawn(m.isOkay ? Task.okay(m.value) : Task.fail(m.value)),
					);
				}),
			);
		});
	});

	describe("values", () => {
		it("should agree with okayValues and failValues", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(result(fc.anything(), fc.anything()), <A, E>(m: Result<A, E>) => {
					expect([...m.values()]).toStrictEqual([...m.okayValues(), ...m.failValues()]);
				}),
			);
		});
	});

	describe("effectMap", () => {
		it("should agree with effect", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.func(fc.anything()),
					<A, B, E>(m: Result<A, E>, f: (a: A) => B) => {
						expect(
							Okay.fromGenerator(function* () {
								const b: B = yield* m.effectMap(f);
								return b;
							}),
						).toStrictEqual(
							Okay.fromGenerator(function* () {
								const b: B = f(yield* m.effect());
								return b;
							}),
						);
					},
				),
			);
		});
	});
});

describe("Okay", () => {
	describe("fromGenerator", () => {
		it("should be equivalent to multiple flatMap calls", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.integer({ min: 1 }), fc.anything()),
					fc.constant(isPowerOfTwo),
					fc.constant((n: number) => new Okay(hotpo(n))),
					fc.func(result(fc.anything(), fc.anything())),
					<A, B, E>(
						m: Result<A, E>,
						p: (a: A) => boolean,
						f: (a: A) => Result<A, E>,
						g: (a: A) => Result<B, E>,
					) => {
						expect(
							Okay.fromGenerator(function* () {
								let a: A = yield* m.effect();
								while (!p(a)) a = yield* f(a).effect();
								const b: B = yield* g(a).effect();
								return b;
							}),
						).toStrictEqual(
							m.flatMapOkayUntil((a) => (p(a) ? g(a).mapOkay(Okay.of) : f(a).mapOkay(Fail.of))),
						);
					},
				),
			);
		});

		it("should throw the value when the generator yields Fail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					result(fc.anything(), fc.anything()),
					<A, E>(m: Result<A, E>, n: Result<A, E>) => {
						expect(
							Okay.fromGenerator(function* () {
								try {
									const a: A = yield* m.effect();
									return a;
								} catch {
									const a: A = yield* n.effect();
									return a;
								}
							}),
						).toStrictEqual(m.orElse(n));
					},
				),
			);
		});

		it("should return Fail when the generator throws an Exception", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					result(fc.anything(), fc.anything()),
					fc.anything(),
					<A, E>(m: Result<A, E>, x: E) => {
						expect(
							Okay.fromGenerator(function* () {
								if (m.isOkay) throw x;
								const a: A = yield* m.effect<A, E>();
								return a;
							}),
						).toStrictEqual(m.isOkay ? new Fail(x) : m);
					},
				),
			);
		});
	});
});
