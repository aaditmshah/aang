import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Option } from "./option.js";
import type { Result } from "./result.js";
import type { Task } from "./task.js";

import { none, option, pair, result, stringable, task } from "./arbitraries.test-util.js";
import { id } from "./miscellaneous.js";
import { None, Some } from "./option.js";
import { Pair } from "./pair.js";
import { collatz, spawn } from "./utils.test-util.js";

describe("Option", () => {
	describe("toString", () => {
		it("should convert Some to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(stringable, <A>(a: A) => {
					expect(new Some(a).toString()).toStrictEqual(`Some(${String(a)})`);
				}),
			);
		});

		it("should convert None to a string", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(none, (u) => {
					expect(u.toString()).toStrictEqual("None");
				}),
			);
		});
	});

	describe("fold", () => {
		it("should fold the Option", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					fc.func(fc.anything()),
					fc.anything(),
					<A, B>(u: Option<A>, f: (a: A) => B, b: B) => {
						expect(u.fold(f, b)).toStrictEqual(u.isSome ? f(u.value) : b);
					},
				),
			);
		});
	});

	describe("map", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), <A>(u: Option<A>) => {
					expect(u.map(id)).toStrictEqual(u);
				}),
			);
		});
	});

	describe("replace", () => {
		it("should agree with map", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), fc.anything(), <A, B>(u: Option<A>, b: B) => {
					expect(u.replace(b)).toStrictEqual(u.map(() => b));
				}),
			);
		});
	});

	describe("and", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), <A>(v: Option<A>) => {
					expect(new Some(undefined).and(v)).toStrictEqual(v.map((y) => new Pair(undefined, y)));
				}),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), <A>(u: Option<A>) => {
					expect(u.and(new Some(undefined))).toStrictEqual(u.map((x) => new Pair(x, undefined)));
				}),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					option(fc.anything()),
					option(fc.anything()),
					<A, B, C>(u: Option<A>, v: Option<B>, w: Option<C>) => {
						expect(u.and(v.and(w)).map((x) => x.associateLeft())).toStrictEqual(u.and(v).and(w));
					},
				),
			);
		});

		it("should have a left annihilator", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), <A>(v: Option<A>) => {
					expect(None.instance.and(v)).toStrictEqual(None.instance);
				}),
			);
		});

		it("should have a right annihilator", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), <A>(u: Option<A>) => {
					expect(u.and(None.instance)).toStrictEqual(None.instance);
				}),
			);
		});
	});

	describe("andThen", () => {
		it("should agree with and", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					option(fc.anything()),
					<A, B>(u: Option<A>, v: Option<B>) => {
						expect(u.andThen(v)).toStrictEqual(u.and(v).map((x) => x.snd));
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
					option(fc.anything()),
					option(fc.anything()),
					<A, B>(u: Option<A>, v: Option<B>) => {
						expect(u.andWhen(v)).toStrictEqual(u.and(v).map((x) => x.fst));
					},
				),
			);
		});
	});

	describe("or", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), <A>(v: Option<A>) => {
					expect(None.instance.or(v)).toStrictEqual(v);
				}),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), <A>(u: Option<A>) => {
					expect(u.or(None.instance)).toStrictEqual(u);
				}),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					option(fc.anything()),
					option(fc.anything()),
					<A>(u: Option<A>, v: Option<A>, w: Option<A>) => {
						expect(u.or(v.or(w))).toStrictEqual(u.or(v).or(w));
					},
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
					<A, B>(u: Option<A>, v: Option<A>, w: Option<B>) => {
						expect(u.or(v).and(w)).toStrictEqual(u.and(w).or(v.and(w)));
					},
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
					<A, B>(u: Option<A>, v: Option<B>, w: Option<B>) => {
						expect(u.and(v.or(w))).toStrictEqual(u.and(v).or(u.and(w)));
					},
				),
			);
		});
	});

	describe("flatMap", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					fc.anything(),
					fc.func(option(fc.anything())),
					<A, B>(a: A, k: (a: A) => Option<B>) => {
						expect(new Some(a).flatMap(k)).toStrictEqual(k(a));
					},
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), <A>(m: Option<A>) => {
					expect(m.flatMap(Some.of)).toStrictEqual(m);
				}),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					fc.func(option(fc.anything())),
					fc.func(option(fc.anything())),
					<A, B, C>(m: Option<A>, k: (a: A) => Option<B>, h: (b: B) => Option<C>) => {
						expect(m.flatMap((a) => k(a).flatMap(h))).toStrictEqual(m.flatMap(k).flatMap(h));
					},
				),
			);
		});
	});

	describe("flatten", () => {
		it("should agree with flatMap", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(option(fc.anything())), <A>(u: Option<Option<A>>) => {
					expect(u.flatten()).toStrictEqual(u.flatMap(id));
				}),
			);
		});
	});

	describe("flatMapUntil", () => {
		it("should be equivalent to multiple flatMap calls", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.integer({ min: 1 })),
					fc.constant((n: number): Option<Result<number, number>> => new Some(collatz(n))),
					<A, B>(m: Option<A>, k: (a: A) => Option<Result<B, A>>) => {
						const f = (x: Result<B, A>): Option<B> =>
							x.isOkay ? new Some(x.value) : k(x.value).flatMap(f);
						expect(m.flatMapUntil(k)).toStrictEqual(m.flatMap(k).flatMap(f));
					},
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
					<A>(m: Option<A>, p: (a: A) => boolean, q: (a: A) => boolean) => {
						expect(m.filter(p).filter(q)).toStrictEqual(m.filter((a) => p(a) && q(a)));
					},
				),
			);
		});

		it("should have an identity input", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), <A>(m: Option<A>) => {
					expect(m.filter(() => true)).toStrictEqual(m);
				}),
			);
		});

		it("should have an annihilating input", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), <A>(m: Option<A>) => {
					expect(m.filter(() => false)).toStrictEqual(None.instance);
				}),
			);
		});
	});

	describe("isSomeAnd", () => {
		it("should agree with filter", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					fc.func(fc.boolean()),
					<A>(m: Option<A>, p: (a: A) => boolean) => {
						expect(m.isSomeAnd(p)).toStrictEqual(m.filter(p).isSome);
					},
				),
			);
		});
	});

	describe("isNoneOr", () => {
		it("should agree with filter", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(fc.anything()),
					fc.func(fc.boolean()),
					<A>(m: Option<A>, p: (a: A) => boolean) => {
						expect(m.isNoneOr(p)).toStrictEqual(m.filter((a) => !p(a)).isNone);
					},
				),
			);
		});
	});

	describe("unzipWith", () => {
		it("should unzip None", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					fc.func(pair(fc.anything(), fc.anything())),
					<A, B, C>(f: (a: A) => Pair<B, C>) => {
						expect(None.instance.unzipWith(f)).toStrictEqual(Pair.from(None.instance));
					},
				),
			);
		});

		it("should unzip Some", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					fc.anything(),
					fc.func(pair(fc.anything(), fc.anything())),
					<A, B, C>(a: A, f: (a: A) => Pair<B, C>) => {
						expect(new Some(a).unzipWith(f)).toStrictEqual(f(a).map(Some.of, Some.of));
					},
				),
			);
		});
	});

	describe("unzip", () => {
		it("should agree with unzipWith", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(pair(fc.anything(), fc.anything())), <A, B>(u: Option<Pair<A, B>>) => {
					expect(u.unzip()).toStrictEqual(u.unzipWith(id));
				}),
			);
		});
	});

	describe("transposeMapOkay", () => {
		it("should be inverted by Result#transposeMapOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(result(fc.anything(), fc.anything())),
					<A, E>(m: Option<Result<A, E>>) => {
						expect(m.transposeMapOkay(id).transposeMapOkay(id)).toStrictEqual(m);
					},
				),
			);
		});
	});

	describe("transposeMapFail", () => {
		it("should be inverted by Result#transposeMapFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(result(fc.anything(), fc.anything())),
					<A, E>(m: Option<Result<A, E>>) => {
						expect(m.transposeMapFail(id).transposeMapFail(id)).toStrictEqual(m);
					},
				),
			);
		});
	});

	describe("transposeOkay", () => {
		it("should be inverted by Result#transposeOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(result(fc.anything(), fc.anything())),
					<A, E>(m: Option<Result<A, E>>) => {
						expect(m.transposeOkay().transposeOkay()).toStrictEqual(m);
					},
				),
			);
		});
	});

	describe("transposeFail", () => {
		it("should be inverted by Result#transposeFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					option(result(fc.anything(), fc.anything())),
					<A, E>(m: Option<Result<A, E>>) => {
						expect(m.transposeFail().transposeFail()).toStrictEqual(m);
					},
				),
			);
		});
	});

	describe("exchangeOkay", () => {
		it("should agree with exchangeMapOkay", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					option(task(fc.anything(), fc.anything())),
					async <A, E>(m: Option<Task<A, E>>) => {
						expect(await spawn(m.exchangeOkay())).toStrictEqual(await spawn(m.exchangeMapOkay(id)));
					},
				),
			);
		});
	});

	describe("exchangeFail", () => {
		it("should agree with exchangeMapFail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					option(task(fc.anything(), fc.anything())),
					async <A, E>(m: Option<Task<A, E>>) => {
						expect(await spawn(m.exchangeFail())).toStrictEqual(await spawn(m.exchangeMapFail(id)));
					},
				),
			);
		});
	});

	describe("extractSome", () => {
		it("should extract the value from Some", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), fc.anything(), <A>(a: A, x: A) => {
					expect(new Some(a).extractSome(x)).toStrictEqual(a);
				}),
			);
		});

		it("should return the default value for None", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), <A>(x: A) => {
					expect(None.instance.extractSome(x)).toStrictEqual(x);
				}),
			);
		});
	});

	describe("extractMapSome", () => {
		it("should agree with extractSome", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), fc.anything(), <A>(m: Option<A>, a: A) => {
					expect(m.extractMapSome(() => a)).toStrictEqual(m.extractSome(a));
				}),
			);
		});
	});

	describe("toResultOkay", () => {
		it("should be inverted by toOptionOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), fc.anything(), <E, A>(m: Option<A>, x: E) => {
					expect(m.toResultOkay(x).toOptionOkay()).toStrictEqual(m);
				}),
			);
		});
	});

	describe("toResultFail", () => {
		it("should be inverted by toOptionFail", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(option(fc.anything()), fc.anything(), <E, A>(m: Option<E>, x: A) => {
					expect(m.toResultFail(x).toOptionFail()).toStrictEqual(m);
				}),
			);
		});
	});

	describe("values", () => {
		it("should iterate over the value of Some", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), <A>(a: A) => {
					expect([...new Some(a).values()]).toStrictEqual([a]);
				}),
			);
		});

		it("should not iterate over None", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(none, (m: None) => {
					expect([...m.values()]).toStrictEqual([]);
				}),
			);
		});
	});
});

describe("Some", () => {
	describe("fromValid", () => {
		it("should agree with the predicate", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), fc.func(fc.boolean()), <A>(a: A, f: (a: A) => boolean) => {
					expect(Some.fromValid(a, f)).toStrictEqual(f(a) ? new Some(a) : None.instance);
				}),
			);
		});
	});
});

describe("None", () => {
	describe("fromNullish", () => {
		it("should convert any value into a non-nullish option", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), <A>(a: A) => {
					expect(None.fromNullish(a)).toStrictEqual(a == null ? None.instance : new Some(a));
				}),
			);
		});
	});

	describe("fromFalsy", () => {
		it("should convert any value into a non-falsy option", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(fc.anything(), <A>(a: A) => {
					expect(None.fromFalsy(a)).toStrictEqual(a ? new Some(a) : None.instance);
				}),
			);
		});
	});
});
