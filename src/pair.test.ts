import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Option } from "./option.js";
import type { Result } from "./result.js";
import type { Semigroup } from "./semigroup.js";

import { option, pair, result, stringable, task, text } from "./arbitraries.test-util.js";
import { id } from "./miscellaneous.js";
import { Some } from "./option.js";
import { Pair } from "./pair.js";
import { Fail, Okay } from "./result.js";
import { Task } from "./task.js";
import { Text } from "./text.js";
import { collatz, hotpo, isPowerOfTwo, spawn } from "./utils.test-util.js";

describe("Pair", () => {
	describe("from", () => {
		it("should agree with Pair.of", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), <A>(a: A) => {
					expect(Pair.from(a)).toStrictEqual(Pair.of(a, a));
				}),
			);
		});
	});

	describe("fst", () => {
		it("should return a pair of the value and undefined", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), <A>(a: A) => {
					expect(Pair.fst(a)).toStrictEqual(new Pair(a, undefined));
				}),
			);
		});
	});

	describe("snd", () => {
		it("should return a pair of undefined and the value", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), <B>(b: B) => {
					expect(Pair.snd(b)).toStrictEqual(new Pair(undefined, b));
				}),
			);
		});
	});

	describe("toString", () => {
		it("should convert the Pair to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(stringable, stringable), <A, B>(m: Pair<A, B>) => {
					expect(m.toString()).toStrictEqual(`Pair(${String(m.fst)}, ${String(m.snd)})`);
				}),
			);
		});
	});

	describe("fold", () => {
		it("should fold the Pair", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					fc.anything(),
					fc.anything(),
					fc.func(fc.anything()),
					<A, B, C>(a: A, b: B, f: (a: A, b: B) => C) => {
						expect(new Pair(a, b).fold(f)).toStrictEqual(f(a, b));
					},
				),
			);
		});
	});

	describe("map", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), <A, B>(u: Pair<A, B>) => {
					expect(u.map(id, id)).toStrictEqual(u);
				}),
			);
		});
	});

	describe("mapFst", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), <A, B>(u: Pair<A, B>) => {
					expect(u.mapFst(id)).toStrictEqual(u);
				}),
			);
		});
	});

	describe("mapSnd", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), <A, B>(u: Pair<A, B>) => {
					expect(u.mapSnd(id)).toStrictEqual(u);
				}),
			);
		});
	});

	describe("replaceFst", () => {
		it("should agree with mapFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.anything(),
					<A, B, C>(u: Pair<A, C>, b: B) => {
						expect(u.replaceFst(b)).toStrictEqual(u.mapFst(() => b));
					},
				),
			);
		});
	});

	describe("replaceSnd", () => {
		it("should agree with mapSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.anything(),
					<A, B, C>(u: Pair<A, B>, c: C) => {
						expect(u.replaceSnd(c)).toStrictEqual(u.mapSnd(() => c));
					},
				),
			);
		});
	});

	describe("and", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), <A, B>(v: Pair<A, B>) => {
					expect(new Pair(undefined, undefined).and(v)).toStrictEqual(
						v.map(
							(y) => new Pair(undefined, y),
							(y) => new Pair(undefined, y),
						),
					);
				}),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), <A, B>(u: Pair<A, B>) => {
					expect(u.and(new Pair(undefined, undefined))).toStrictEqual(
						u.map(
							(x) => new Pair(x, undefined),
							(x) => new Pair(x, undefined),
						),
					);
				}),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					pair(fc.anything(), fc.anything()),
					pair(fc.anything(), fc.anything()),
					<A, B, C, D, E, F>(u: Pair<A, B>, v: Pair<C, D>, w: Pair<E, F>) => {
						expect(
							u.and(v.and(w)).map(
								(x) => x.associateLeft(),
								(x) => x.associateLeft(),
							),
						).toStrictEqual(u.and(v).and(w));
					},
				),
			);
		});
	});

	describe("andFst", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), text),
					fc.constant(new Text("")),
					<A, B extends Semigroup<B>>(v: Pair<A, B>, b: B) => {
						expect(new Pair(undefined, b).andFst(v)).toStrictEqual(
							v.mapFst((y) => new Pair(undefined, y)),
						);
					},
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), text),
					fc.constant(new Text("")),
					<A, B extends Semigroup<B>>(u: Pair<A, B>, b: B) => {
						expect(u.andFst(new Pair(undefined, b))).toStrictEqual(
							u.mapFst((x) => new Pair(x, undefined)),
						);
					},
				),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), text),
					pair(fc.anything(), text),
					pair(fc.anything(), text),
					<A, B, C, D extends Semigroup<D>>(u: Pair<A, D>, v: Pair<B, D>, w: Pair<C, D>) => {
						expect(u.andFst(v.andFst(w)).mapFst((x) => x.associateLeft())).toStrictEqual(
							u.andFst(v).andFst(w),
						);
					},
				),
			);
		});
	});

	describe("andThenFst", () => {
		it("should agree with andFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), text),
					pair(fc.anything(), text),
					<A, B, C extends Semigroup<C>>(u: Pair<A, C>, v: Pair<B, C>) => {
						expect(u.andThenFst(v)).toStrictEqual(u.andFst(v).mapFst((x) => x.snd));
					},
				),
			);
		});
	});

	describe("andWhenFst", () => {
		it("should agree with andFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), text),
					pair(fc.anything(), text),
					<A, B, C extends Semigroup<C>>(u: Pair<A, C>, v: Pair<B, C>) => {
						expect(u.andWhenFst(v)).toStrictEqual(u.andFst(v).mapFst((x) => x.fst));
					},
				),
			);
		});
	});

	describe("andSnd", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, fc.anything()),
					fc.constant(new Text("")),
					<A extends Semigroup<A>, B>(v: Pair<A, B>, a: A) => {
						expect(new Pair(a, undefined).andSnd(v)).toStrictEqual(
							v.mapSnd((y) => new Pair(undefined, y)),
						);
					},
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, fc.anything()),
					fc.constant(new Text("")),
					<A extends Semigroup<A>, B>(u: Pair<A, B>, a: A) => {
						expect(u.andSnd(new Pair(a, undefined))).toStrictEqual(
							u.mapSnd((x) => new Pair(x, undefined)),
						);
					},
				),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, fc.anything()),
					pair(text, fc.anything()),
					pair(text, fc.anything()),
					<A extends Semigroup<A>, B, C, D>(u: Pair<A, B>, v: Pair<A, C>, w: Pair<A, D>) => {
						expect(u.andSnd(v.andSnd(w)).mapSnd((x) => x.associateLeft())).toStrictEqual(
							u.andSnd(v).andSnd(w),
						);
					},
				),
			);
		});
	});

	describe("andThenSnd", () => {
		it("should agree with andSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, fc.anything()),
					pair(text, fc.anything()),
					<A extends Semigroup<A>, B, C>(u: Pair<A, B>, v: Pair<A, C>) => {
						expect(u.andThenSnd(v)).toStrictEqual(u.andSnd(v).mapSnd((x) => x.snd));
					},
				),
			);
		});
	});

	describe("andWhenSnd", () => {
		it("should agree with andSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, fc.anything()),
					pair(text, fc.anything()),
					<A extends Semigroup<A>, B, C>(u: Pair<A, B>, v: Pair<A, C>) => {
						expect(u.andWhenSnd(v)).toStrictEqual(u.andSnd(v).mapSnd((x) => x.fst));
					},
				),
			);
		});
	});

	describe("flatMapFst", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					fc.anything(),
					fc.constant(new Text("")),
					fc.func(pair(fc.anything(), text)),
					<A, B, C extends Semigroup<C>>(a: A, c: C, k: (a: A) => Pair<B, C>) => {
						expect(new Pair(a, c).flatMapFst(k)).toStrictEqual(k(a));
					},
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), text),
					fc.constant(new Text("")),
					<A, B extends Semigroup<B>>(m: Pair<A, B>, b: B) => {
						expect(m.flatMapFst((a) => new Pair(a, b))).toStrictEqual(m);
					},
				),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), text),
					fc.func(pair(fc.anything(), text)),
					fc.func(pair(fc.anything(), text)),
					<A, B, C, D extends Semigroup<D>>(
						m: Pair<A, D>,
						k: (a: A) => Pair<B, D>,
						h: (b: B) => Pair<C, D>,
					) => {
						expect(m.flatMapFst((a) => k(a).flatMapFst(h))).toStrictEqual(
							m.flatMapFst(k).flatMapFst(h),
						);
					},
				),
			);
		});
	});

	describe("flatMapSnd", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					fc.constant(new Text("")),
					fc.anything(),
					fc.func(pair(text, fc.anything())),
					<A extends Semigroup<A>, B, C>(a: A, b: B, k: (b: B) => Pair<A, C>) => {
						expect(new Pair(a, b).flatMapSnd(k)).toStrictEqual(k(b));
					},
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, fc.anything()),
					fc.constant(new Text("")),
					<A extends Semigroup<A>, B>(m: Pair<A, B>, a: A) => {
						expect(m.flatMapSnd((b) => new Pair(a, b))).toStrictEqual(m);
					},
				),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, fc.anything()),
					fc.func(pair(text, fc.anything())),
					fc.func(pair(text, fc.anything())),
					<A extends Semigroup<A>, B, C, D>(
						m: Pair<A, B>,
						k: (b: B) => Pair<A, C>,
						h: (c: C) => Pair<A, D>,
					) => {
						expect(m.flatMapSnd((b) => k(b).flatMapSnd(h))).toStrictEqual(
							m.flatMapSnd(k).flatMapSnd(h),
						);
					},
				),
			);
		});
	});

	describe("flattenFst", () => {
		it("should agree with flatMapFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(pair(fc.anything(), text), text),
					<A, B extends Semigroup<B>>(u: Pair<Pair<A, B>, B>) => {
						expect(u.flattenFst()).toStrictEqual(u.flatMapFst(id));
					},
				),
			);
		});
	});

	describe("flattenSnd", () => {
		it("should agree with flatMapSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, pair(text, fc.anything())),
					<A extends Semigroup<A>, B>(u: Pair<A, Pair<A, B>>) => {
						expect(u.flattenSnd()).toStrictEqual(u.flatMapSnd(id));
					},
				),
			);
		});
	});

	describe("flatMapFstUntil", () => {
		it("should be equivalent to multiple flatMapFst calls", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.integer({ min: 1 }), text),
					fc.constant(new Text("")),
					fc.func(text).map((f) => (n: number) => new Pair(collatz(n), f(n))),
					<A, B, C extends Semigroup<C>>(
						m: Pair<A, C>,
						c: C,
						k: (a: A) => Pair<Result<B, A>, C>,
					) => {
						const f = (x: Result<B, A>): Pair<B, C> =>
							x.isOkay ? new Pair(x.value, c) : k(x.value).flatMapFst(f);
						expect(m.flatMapFstUntil(k)).toStrictEqual(m.flatMapFst(k).flatMapFst(f));
					},
				),
			);
		});
	});

	describe("flatMapSndUntil", () => {
		it("should be equivalent to multiple flatMapSnd calls", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, fc.integer({ min: 1 })),
					fc.constant(new Text("")),
					fc.func(text).map((f) => (n: number) => new Pair(f(n), collatz(n))),
					<A extends Semigroup<A>, B, C>(
						m: Pair<A, B>,
						a: A,
						k: (b: B) => Pair<A, Result<C, B>>,
					) => {
						const g = (x: Result<C, B>): Pair<A, C> =>
							x.isOkay ? new Pair(a, x.value) : k(x.value).flatMapSnd(g);
						expect(m.flatMapSndUntil(k)).toStrictEqual(m.flatMapSnd(k).flatMapSnd(g));
					},
				),
			);
		});
	});

	describe("extendMapFst", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(fc.anything()),
					<A, B, C>(m: Pair<A, C>, f: (m: Pair<A, C>) => B) => {
						expect(m.extendMapFst(f).fst).toStrictEqual(f(m));
					},
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), <A, B>(m: Pair<A, B>) => {
					expect(m.extendMapFst((m) => m.fst)).toStrictEqual(m);
				}),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(fc.anything()),
					fc.func(fc.anything()),
					<A, B, C, D>(m: Pair<A, D>, f: (m: Pair<A, D>) => B, g: (n: Pair<B, D>) => C) => {
						expect(m.extendMapFst((m) => g(m.extendMapFst(f)))).toStrictEqual(
							m.extendMapFst(f).extendMapFst(g),
						);
					},
				),
			);
		});
	});

	describe("extendMapSnd", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(fc.anything()),
					<A, B, C>(m: Pair<A, B>, f: (m: Pair<A, B>) => C) => {
						expect(m.extendMapSnd(f).snd).toStrictEqual(f(m));
					},
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), <A, B>(m: Pair<A, B>) => {
					expect(m.extendMapSnd((m) => m.snd)).toStrictEqual(m);
				}),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(fc.anything()),
					fc.func(fc.anything()),
					<A, B, C, D>(m: Pair<A, B>, f: (m: Pair<A, B>) => C, g: (n: Pair<A, C>) => D) => {
						expect(m.extendMapSnd((m) => g(m.extendMapSnd(f)))).toStrictEqual(
							m.extendMapSnd(f).extendMapSnd(g),
						);
					},
				),
			);
		});
	});

	describe("extendFst", () => {
		it("should agree with extendMapFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), <A, B>(u: Pair<A, B>) => {
					expect(u.extendFst()).toStrictEqual(u.extendMapFst(id));
				}),
			);
		});
	});

	describe("extendSnd", () => {
		it("should agree with extendMapSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), <A, B>(u: Pair<A, B>) => {
					expect(u.extendSnd()).toStrictEqual(u.extendMapSnd(id));
				}),
			);
		});
	});

	describe("commute", () => {
		it("should be its own inverse", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), <A, B>(u: Pair<A, B>) => {
					expect(u.commute().commute()).toStrictEqual(u);
				}),
			);
		});
	});

	describe("andMapFstOption", () => {
		it("should agree with andMapOption", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(option(fc.anything())),
					<X, A, B>(u: Pair<X, B>, f: (x: X) => Option<A>) => {
						expect(u.andMapFstOption(f)).toStrictEqual(u.andMapOption(f, Some.of));
					},
				),
			);
		});
	});

	describe("andMapSndOption", () => {
		it("should agree with andMapOption", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(option(fc.anything())),
					<Y, A, B>(u: Pair<A, Y>, g: (y: Y) => Option<B>) => {
						expect(u.andMapSndOption(g)).toStrictEqual(u.andMapOption(Some.of, g));
					},
				),
			);
		});
	});

	describe("andOption", () => {
		it("should agree with andMapOption", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(option(fc.anything()), option(fc.anything())),
					<A, B>(u: Pair<Option<A>, Option<B>>) => {
						expect(u.andOption()).toStrictEqual(u.andMapOption(id, id));
					},
				),
			);
		});
	});

	describe("andFstOption", () => {
		it("should agree with andMapOption", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(option(fc.anything()), fc.anything()), <A, B>(u: Pair<Option<A>, B>) => {
					expect(u.andFstOption()).toStrictEqual(u.andMapOption(id, Some.of));
				}),
			);
		});
	});

	describe("andSndOption", () => {
		it("should agree with andMapOption", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), option(fc.anything())), <A, B>(u: Pair<A, Option<B>>) => {
					expect(u.andSndOption()).toStrictEqual(u.andMapOption(Some.of, id));
				}),
			);
		});
	});

	describe("andMapFstResult", () => {
		it("should agree with andMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					<X, A, B, E>(u: Pair<X, B>, f: (x: X) => Result<A, E>) => {
						expect(u.andMapFstResult(f)).toStrictEqual(u.andMapResult(f, Okay.of));
					},
				),
			);
		});
	});

	describe("andMapSndResult", () => {
		it("should agree with andMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					<Y, A, B, E>(u: Pair<A, Y>, g: (y: Y) => Result<B, E>) => {
						expect(u.andMapSndResult(g)).toStrictEqual(u.andMapResult(Okay.of, g));
					},
				),
			);
		});
	});

	describe("andResult", () => {
		it("should agree with andMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(result(fc.anything(), fc.anything()), result(fc.anything(), fc.anything())),
					<A, B, E>(u: Pair<Result<A, E>, Result<B, E>>) => {
						expect(u.andResult()).toStrictEqual(u.andMapResult(id, id));
					},
				),
			);
		});
	});

	describe("andFstResult", () => {
		it("should agree with andMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(result(fc.anything(), fc.anything()), fc.anything()),
					<A, B, E>(u: Pair<Result<A, E>, B>) => {
						expect(u.andFstResult()).toStrictEqual(u.andMapResult(id, Okay.of));
					},
				),
			);
		});
	});

	describe("andSndResult", () => {
		it("should agree with andMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), result(fc.anything(), fc.anything())),
					<A, B, E>(u: Pair<A, Result<B, E>>) => {
						expect(u.andSndResult()).toStrictEqual(u.andMapResult(Okay.of, id));
					},
				),
			);
		});
	});

	describe("orMapFstResult", () => {
		it("should agree with orMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					<X, A, E, F>(u: Pair<X, F>, f: (x: X) => Result<A, E>) => {
						expect(u.orMapFstResult(f)).toStrictEqual(u.orMapResult(f, Fail.of));
					},
				),
			);
		});
	});

	describe("orMapSndResult", () => {
		it("should agree with orMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					<Y, A, E, F>(u: Pair<E, Y>, g: (y: Y) => Result<A, F>) => {
						expect(u.orMapSndResult(g)).toStrictEqual(u.orMapResult(Fail.of, g));
					},
				),
			);
		});
	});

	describe("orResult", () => {
		it("should agree with orMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(result(fc.anything(), fc.anything()), result(fc.anything(), fc.anything())),
					<A, E, F>(u: Pair<Result<A, E>, Result<A, F>>) => {
						expect(u.orResult()).toStrictEqual(u.orMapResult(id, id));
					},
				),
			);
		});
	});

	describe("orFstResult", () => {
		it("should agree with orMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(result(fc.anything(), fc.anything()), fc.anything()),
					<A, E, F>(u: Pair<Result<A, E>, F>) => {
						expect(u.orFstResult()).toStrictEqual(u.orMapResult(id, Fail.of));
					},
				),
			);
		});
	});

	describe("orSndResult", () => {
		it("should agree with orMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), result(fc.anything(), fc.anything())),
					<A, E, F>(u: Pair<E, Result<A, F>>) => {
						expect(u.orSndResult()).toStrictEqual(u.orMapResult(Fail.of, id));
					},
				),
			);
		});
	});

	describe("andMapFstTask", () => {
		it("should agree with andMapTask", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					async <X, A, B, E>(m: Pair<X, B>, f: (x: X) => Task<A, E>) => {
						expect(await spawn(m.andMapFstTask(f))).toStrictEqual(
							await spawn(m.andMapTask(f, Task.okay)),
						);
					},
				),
			);
		});
	});

	describe("andMapSndTask", () => {
		it("should agree with andMapTask", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					async <Y, A, B, E>(m: Pair<A, Y>, g: (y: Y) => Task<B, E>) => {
						expect(await spawn(m.andMapSndTask(g))).toStrictEqual(
							await spawn(m.andMapTask(Task.okay, g)),
						);
					},
				),
			);
		});
	});

	describe("andTask", () => {
		it("should agree with andMapTask", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(task(fc.anything(), fc.anything()), task(fc.anything(), fc.anything())),
					async <A, B, E>(m: Pair<Task<A, E>, Task<B, E>>) => {
						expect(await spawn(m.andTask())).toStrictEqual(await spawn(m.andMapTask(id, id)));
					},
				),
			);
		});
	});

	describe("andFstTask", () => {
		it("should agree with andMapTask", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(task(fc.anything(), fc.anything()), fc.anything()),
					async <A, B, E>(m: Pair<Task<A, E>, B>) => {
						expect(await spawn(m.andFstTask())).toStrictEqual(
							await spawn(m.andMapTask(id, Task.okay)),
						);
					},
				),
			);
		});
	});

	describe("andSndTask", () => {
		it("should agree with andMapTask", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(fc.anything(), task(fc.anything(), fc.anything())),
					async <A, B, E>(m: Pair<A, Task<B, E>>) => {
						expect(await spawn(m.andSndTask())).toStrictEqual(
							await spawn(m.andMapTask(Task.okay, id)),
						);
					},
				),
			);
		});
	});

	describe("orMapFstTask", () => {
		it("should agree with orMapTask", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					async <X, A, E, F>(m: Pair<X, F>, f: (x: X) => Task<A, E>) => {
						expect(await spawn(m.orMapFstTask(f))).toStrictEqual(
							await spawn(m.orMapTask(f, Task.fail)),
						);
					},
				),
			);
		});
	});

	describe("orMapSndTask", () => {
		it("should agree with orMapTask", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					async <Y, A, E, F>(m: Pair<E, Y>, g: (y: Y) => Task<A, F>) => {
						expect(await spawn(m.orMapSndTask(g))).toStrictEqual(
							await spawn(m.orMapTask(Task.fail, g)),
						);
					},
				),
			);
		});
	});

	describe("orTask", () => {
		it("should agree with orMapTask", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(task(fc.anything(), fc.anything()), task(fc.anything(), fc.anything())),
					async <A, E, F>(m: Pair<Task<A, E>, Task<A, F>>) => {
						expect(await spawn(m.orTask())).toStrictEqual(await spawn(m.orMapTask(id, id)));
					},
				),
			);
		});
	});

	describe("orFstTask", () => {
		it("should agree with orMapTask", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(task(fc.anything(), fc.anything()), fc.anything()),
					async <A, E, F>(m: Pair<Task<A, E>, F>) => {
						expect(await spawn(m.orFstTask())).toStrictEqual(
							await spawn(m.orMapTask(id, Task.fail)),
						);
					},
				),
			);
		});
	});

	describe("orSndTask", () => {
		it("should agree with orMapTask", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(fc.anything(), task(fc.anything(), fc.anything())),
					async <A, E, F>(m: Pair<E, Task<A, F>>) => {
						expect(await spawn(m.orSndTask())).toStrictEqual(
							await spawn(m.orMapTask(Task.fail, id)),
						);
					},
				),
			);
		});
	});

	describe("distributeMapFst", () => {
		it("should agree with distributeMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(pair(fc.anything(), fc.anything())),
					<X, A, B, C>(u: Pair<X, C>, f: (x: X) => Pair<A, B>) => {
						expect(u.distributeMapFst(f)).toStrictEqual(u.distributeMap(f, Pair.from));
					},
				),
			);
		});
	});

	describe("distributeMapSnd", () => {
		it("should agree with distributeMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(pair(fc.anything(), fc.anything())),
					<Y, A, B, C>(u: Pair<A, Y>, g: (y: Y) => Pair<B, C>) => {
						expect(u.distributeMapSnd(g)).toStrictEqual(u.distributeMap(Pair.from, g));
					},
				),
			);
		});
	});

	describe("distribute", () => {
		it("should agree with distributeMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(pair(fc.anything(), fc.anything()), pair(fc.anything(), fc.anything())),
					<A, B, C, D>(u: Pair<Pair<A, B>, Pair<C, D>>) => {
						expect(u.distribute()).toStrictEqual(u.distributeMap(id, id));
					},
				),
			);
		});
	});

	describe("distributeFst", () => {
		it("should agree with distributeMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(pair(fc.anything(), fc.anything()), fc.anything()),
					<A, B, C>(u: Pair<Pair<A, B>, C>) => {
						expect(u.distributeFst()).toStrictEqual(u.distributeMap(id, Pair.from));
					},
				),
			);
		});
	});

	describe("distributeSnd", () => {
		it("should agree with distributeMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), pair(fc.anything(), fc.anything())),
					<A, B, C>(u: Pair<A, Pair<B, C>>) => {
						expect(u.distributeSnd()).toStrictEqual(u.distributeMap(Pair.from, id));
					},
				),
			);
		});
	});

	describe("exchangeMapSnd", () => {
		it("should agree with exchangeSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(pair(fc.anything(), fc.anything()), fc.anything()),
					<A, B, C>(u: Pair<Pair<A, B>, C>) => {
						expect(u.exchangeMapSnd(id)).toStrictEqual(u.exchangeSnd());
					},
				),
			);
		});
	});

	describe("associateMapLeft", () => {
		it("should agree with associateLeft", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), pair(fc.anything(), fc.anything())),
					<A, B, C>(u: Pair<A, Pair<B, C>>) => {
						expect(u.associateMapLeft(id)).toStrictEqual(u.associateLeft());
					},
				),
			);
		});
	});

	describe("exchangeSnd", () => {
		it("should be its own inverse", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(pair(fc.anything(), fc.anything()), fc.anything()),
					<A, B, C>(u: Pair<Pair<A, B>, C>) => {
						expect(u.exchangeSnd().exchangeSnd()).toStrictEqual(u);
					},
				),
			);
		});
	});

	describe("associateLeft", () => {
		it("should be the inverse of associateRight", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(pair(fc.anything(), fc.anything()), fc.anything()),
					<A, B, C>(u: Pair<Pair<A, B>, C>) => {
						expect(u.associateRight().associateLeft()).toStrictEqual(u);
					},
				),
			);
		});
	});

	describe("exchangeMapFst", () => {
		it("should agree with exchangeFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), pair(fc.anything(), fc.anything())),
					<A, B, C>(u: Pair<A, Pair<B, C>>) => {
						expect(u.exchangeMapFst(id)).toStrictEqual(u.exchangeFst());
					},
				),
			);
		});
	});

	describe("associateMapRight", () => {
		it("should agree with associateRight", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(pair(fc.anything(), fc.anything()), fc.anything()),
					<A, B, C>(u: Pair<Pair<A, B>, C>) => {
						expect(u.associateMapRight(id)).toStrictEqual(u.associateRight());
					},
				),
			);
		});
	});

	describe("exchangeFst", () => {
		it("should be its own inverse", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), pair(fc.anything(), fc.anything())),
					<A, B, C>(u: Pair<A, Pair<B, C>>) => {
						expect(u.exchangeFst().exchangeFst()).toStrictEqual(u);
					},
				),
			);
		});
	});

	describe("associateRight", () => {
		it("should be the inverse of associateLeft", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), pair(fc.anything(), fc.anything())),
					<A, B, C>(u: Pair<A, Pair<B, C>>) => {
						expect(u.associateLeft().associateRight()).toStrictEqual(u);
					},
				),
			);
		});
	});

	describe("distributeMapOkay", () => {
		it("should agree with distributeOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), result(fc.anything(), fc.anything())),
					<A, B, C>(u: Pair<A, Result<B, C>>) => {
						expect(u.distributeMapOkay(id)).toStrictEqual(u.distributeOkay());
					},
				),
			);
		});
	});

	describe("distributeOkay", () => {
		it("should be inverted by Result#collectSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), result(fc.anything(), fc.anything())),
					<A, B, C>(u: Pair<A, Result<B, C>>) => {
						expect(u.distributeOkay().collectSnd()).toStrictEqual(u);
					},
				),
			);
		});
	});

	describe("distributeMapFail", () => {
		it("should agree with distributeFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(result(fc.anything(), fc.anything()), fc.anything()),
					<A, B, C>(u: Pair<Result<A, B>, C>) => {
						expect(u.distributeMapFail(id)).toStrictEqual(u.distributeFail());
					},
				),
			);
		});
	});

	describe("distributeFail", () => {
		it("should be inverted by Result#collectFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(result(fc.anything(), fc.anything()), fc.anything()),
					<A, B, C>(u: Pair<Result<A, B>, C>) => {
						expect(u.distributeFail().collectFst()).toStrictEqual(u);
					},
				),
			);
		});
	});

	describe("scatterOkay", () => {
		it("should agree with scatterMapOkay", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(fc.anything(), task(fc.anything(), fc.anything())),
					async <A, B, C>(m: Pair<A, Task<B, C>>) => {
						expect(await spawn(m.scatterOkay())).toStrictEqual(await spawn(m.scatterMapOkay(id)));
					},
				),
			);
		});
	});

	describe("scatterFail", () => {
		it("should agree with scatterMapFail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					pair(task(fc.anything(), fc.anything()), fc.anything()),
					async <A, B, C>(m: Pair<Task<A, B>, C>) => {
						expect(await spawn(m.scatterFail())).toStrictEqual(await spawn(m.scatterMapFail(id)));
					},
				),
			);
		});
	});

	describe("values", () => {
		it("should return the values of the pair", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), fc.anything(), <A, B>(a: A, b: B) => {
					expect(new Pair(a, b).values()).toStrictEqual([a, b]);
				}),
			);
		});
	});

	describe("effectMap", () => {
		it("should agree with effect", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					fc.constant(new Text("")),
					pair(fc.anything(), text),
					fc.func(fc.anything()),
					<A, B, C extends Semigroup<C>>(c: C, m: Pair<A, C>, f: (a: A) => B) => {
						expect(
							Pair.fromGenerator(c, function* () {
								const b: B = yield* m.effectMap(f);
								return b;
							}),
						).toStrictEqual(
							Pair.fromGenerator(c, function* () {
								const b: B = f(yield* m.effect());
								return b;
							}),
						);
					},
				),
			);
		});
	});

	describe("fromGenerator", () => {
		it("should be equivalent to multiple flatMapFst calls", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					fc.constant(new Text("")),
					pair(fc.integer({ min: 1 }), text),
					fc.constant(isPowerOfTwo),
					fc.func(text).map((f) => (n: number) => new Pair(hotpo(n), f(n))),
					fc.func(pair(fc.anything(), text)),
					<A, B, C extends Semigroup<C>>(
						c: C,
						m: Pair<A, C>,
						p: (a: A) => boolean,
						f: (a: A) => Pair<A, C>,
						g: (a: A) => Pair<B, C>,
					) => {
						expect(
							Pair.fromGenerator(c, function* () {
								let a: A = yield* m.effect();
								while (!p(a)) a = yield* f(a).effect();
								const b: B = yield* g(a).effect();
								return b;
							}),
						).toStrictEqual(
							m.flatMapFstUntil((a) => (p(a) ? g(a).mapFst(Okay.of) : f(a).mapFst(Fail.of))),
						);
					},
				),
			);
		});
	});
});
