import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Result } from "./result.js";

import { result, task } from "./arbitraries.test-util.js";
import { id } from "./miscellaneous.js";
import { Pair } from "./pair.js";
import { Fail, Okay } from "./result.js";
import { Task } from "./task.js";
import { collatz, hotpo, isPowerOfTwo, spawn } from "./utils.test-util.js";

describe("Task", () => {
	describe("map", () => {
		it("should preserve identity morphisms", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(u: Task<A, E>) => {
					expect(await spawn(u.map(id, id))).toStrictEqual(await spawn(u));
				}),
			);
		});
	});

	describe("mapOkay", () => {
		it("should preserve identity morphisms", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(u: Task<A, E>) => {
					expect(await spawn(u.mapOkay(id))).toStrictEqual(await spawn(u));
				}),
			);
		});
	});

	describe("mapFail", () => {
		it("should preserve identity morphisms", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(u: Task<A, E>) => {
					expect(await spawn(u.mapFail(id))).toStrictEqual(await spawn(u));
				}),
			);
		});
	});

	describe("replace", () => {
		it("should agree with map", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					fc.anything(),
					fc.anything(),
					async <A, B, E, F>(u: Task<A, E>, b: B, f: F) => {
						expect(await spawn(u.replace(b, f))).toStrictEqual(
							await spawn(
								u.map(
									() => b,
									() => f,
								),
							),
						);
					},
				),
			);
		});
	});

	describe("replaceOkay", () => {
		it("should agree with mapOkay", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					fc.anything(),
					async <A, B, E>(u: Task<A, E>, b: B) => {
						expect(await spawn(u.replaceOkay(b))).toStrictEqual(await spawn(u.mapOkay(() => b)));
					},
				),
			);
		});
	});

	describe("replaceFail", () => {
		it("should agree with mapFail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					fc.anything(),
					async <A, E, F>(u: Task<A, E>, f: F) => {
						expect(await spawn(u.replaceFail(f))).toStrictEqual(await spawn(u.mapFail(() => f)));
					},
				),
			);
		});
	});

	describe("and", () => {
		it("should have a left identity", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(v: Task<A, E>) => {
					expect(await spawn(Task.okay(null).and(v))).toStrictEqual(
						await spawn(v.mapOkay((y) => new Pair(null, y))),
					);
				}),
			);
		});

		it("should have a right identity", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(u: Task<A, E>) => {
					expect(await spawn(u.and(Task.okay(null)))).toStrictEqual(
						await spawn(u.mapOkay((x) => new Pair(x, null))),
					);
				}),
			);
		});

		it("should be associative", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					task(fc.anything(), fc.anything()),
					task(fc.anything(), fc.anything()),
					async <A, B, C, E>(u: Task<A, E>, v: Task<B, E>, w: Task<C, E>) => {
						expect(await spawn(u.and(v.and(w)).mapOkay((x) => x.associateLeft()))).toStrictEqual(
							await spawn(u.and(v).and(w)),
						);
					},
				),
			);
		});

		it("should have a left annihilator", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(v: Task<A, E>) => {
					expect(await spawn(Task.fail(null).and(v))).toStrictEqual(await spawn(Task.fail(null)));
				}),
			);
		});
	});

	describe("andThen", () => {
		it("should agree with and", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					task(fc.anything(), fc.anything()),
					async <A, B, E>(u: Task<A, E>, v: Task<B, E>) => {
						expect(await spawn(u.andThen(v))).toStrictEqual(
							await spawn(u.and(v).mapOkay((x) => x.snd)),
						);
					},
				),
			);
		});
	});

	describe("andWhen", () => {
		it("should agree with and", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					task(fc.anything(), fc.anything()),
					async <A, B, E>(u: Task<A, E>, v: Task<B, E>) => {
						expect(await spawn(u.andWhen(v))).toStrictEqual(
							await spawn(u.and(v).mapOkay((x) => x.fst)),
						);
					},
				),
			);
		});
	});

	describe("or", () => {
		it("should have a left identity", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(v: Task<A, E>) => {
					expect(await spawn(Task.fail(null).or(v))).toStrictEqual(
						await spawn(v.mapFail((y) => new Pair(null, y))),
					);
				}),
			);
		});

		it("should have a right identity", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(u: Task<A, E>) => {
					expect(await spawn(u.or(Task.fail(null)))).toStrictEqual(
						await spawn(u.mapFail((x) => new Pair(x, null))),
					);
				}),
			);
		});

		it("should be associative", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					task(fc.anything(), fc.anything()),
					task(fc.anything(), fc.anything()),
					async <A, E, F, G>(u: Task<A, E>, v: Task<A, F>, w: Task<A, G>) => {
						expect(await spawn(u.or(v.or(w)).mapFail((x) => x.associateLeft()))).toStrictEqual(
							await spawn(u.or(v).or(w)),
						);
					},
				),
			);
		});

		it("should have a left annihilator", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(v: Task<A, E>) => {
					expect(await spawn(Task.okay(null).or(v))).toStrictEqual(await spawn(Task.okay(null)));
				}),
			);
		});
	});

	describe("orElse", () => {
		it("should agree with or", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					task(fc.anything(), fc.anything()),
					async <A, E, F>(u: Task<A, E>, v: Task<A, F>) => {
						expect(await spawn(u.orElse(v))).toStrictEqual(
							await spawn(u.or(v).mapFail((x) => x.snd)),
						);
					},
				),
			);
		});
	});

	describe("orErst", () => {
		it("should agree with or", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					task(fc.anything(), fc.anything()),
					async <A, E, F>(u: Task<A, E>, v: Task<A, F>) => {
						expect(await spawn(u.orErst(v))).toStrictEqual(
							await spawn(u.or(v).mapFail((x) => x.fst)),
						);
					},
				),
			);
		});
	});

	describe("flatMap", () => {
		it("should have a left okay identity", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					fc.anything(),
					fc.func(task(fc.anything(), fc.anything())),
					async <A, B, E>(a: A, k: (a: A) => Task<B, E>) => {
						expect(await spawn(Task.okay(a).flatMap(k, Task.fail))).toStrictEqual(
							await spawn(k(a)),
						);
					},
				),
			);
		});

		it("should have a left fail identity", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					fc.anything(),
					fc.func(task(fc.anything(), fc.anything())),
					async <A, E, F>(x: E, k: (x: E) => Task<A, F>) => {
						expect(await spawn(Task.fail(x).flatMap(Task.okay, k))).toStrictEqual(
							await spawn(k(x)),
						);
					},
				),
			);
		});

		it("should have a right okay identity and a right fail identity", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(m: Task<A, E>) => {
					expect(await spawn(m.flatMap(Task.okay, Task.fail))).toStrictEqual(await spawn(m));
				}),
			);
		});

		it("should be associative", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					fc.func(task(fc.anything(), fc.anything())),
					fc.func(task(fc.anything(), fc.anything())),
					fc.func(task(fc.anything(), fc.anything())),
					async <A, B, C, E, F, G>(
						m: Task<A, E>,
						k: (a: A) => Task<B, F>,
						c: (x: E) => Task<B, F>,
						h: (b: B) => Task<C, G>,
						g: (f: F) => Task<C, G>,
					) => {
						expect(
							await spawn(
								m.flatMap(
									(a) => k(a).flatMap(h, g),
									(x) => c(x).flatMap(h, g),
								),
							),
						).toStrictEqual(await spawn(m.flatMap(k, c).flatMap(h, g)));
					},
				),
			);
		});
	});

	describe("flatMapOkay", () => {
		it("should agree with flatMap", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					async <A, B, E>(m: Task<A, E>, k: (a: A) => Task<B, E>) => {
						expect(await spawn(m.flatMapOkay(k))).toStrictEqual(
							await spawn(m.flatMap(k, Task.fail)),
						);
					},
				),
			);
		});
	});

	describe("flatMapFail", () => {
		it("should agree with flatMap", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					fc.func(task(fc.anything(), fc.anything())),
					async <A, E, F>(m: Task<A, E>, k: (x: E) => Task<A, F>) => {
						expect(await spawn(m.flatMapFail(k))).toStrictEqual(
							await spawn(m.flatMap(Task.okay, k)),
						);
					},
				),
			);
		});
	});

	describe("flatten", () => {
		it("should agree with flatMap", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(task(fc.anything(), fc.anything()), task(fc.anything(), fc.anything())),
					async <A, E>(m: Task<Task<A, E>, Task<A, E>>) => {
						expect(await spawn(m.flatten())).toStrictEqual(await spawn(m.flatMap(id, id)));
					},
				),
			);
		});
	});

	describe("flattenOkay", () => {
		it("should agree with flatMapOkay", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(task(fc.anything(), fc.anything()), fc.anything()),
					async <A, E>(m: Task<Task<A, E>, E>) => {
						expect(await spawn(m.flattenOkay())).toStrictEqual(await spawn(m.flatMapOkay(id)));
					},
				),
			);
		});
	});

	describe("flattenFail", () => {
		it("should agree with flatMapFail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), task(fc.anything(), fc.anything())),
					async <A, E>(m: Task<A, Task<A, E>>) => {
						expect(await spawn(m.flattenFail())).toStrictEqual(await spawn(m.flatMapFail(id)));
					},
				),
			);
		});
	});

	describe("flatMapUntil", () => {
		it("should be equivalent to multiple flatMap calls", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.integer({ min: 1 }), fc.integer({ min: 1 })),
					fc.constant((n: number) => Task.okay(collatz(n))),
					fc.constant((n: number) => Task.fail(collatz(n))),
					async <A, B, E, F>(
						m: Task<A, E>,
						k: (a: A) => Task<Result<B, A>, Result<F, E>>,
						c: (x: E) => Task<Result<B, A>, Result<F, E>>,
					) => {
						const f = (x: Result<B, A>): Task<B, F> =>
							x.isOkay ? Task.okay(x.value) : k(x.value).flatMap(f, g);
						const g = (y: Result<F, E>): Task<B, F> =>
							y.isOkay ? Task.fail(y.value) : c(y.value).flatMap(f, g);
						expect(await spawn(m.flatMapUntil(k, c))).toStrictEqual(
							await spawn(m.flatMap(k, c).flatMap(f, g)),
						);
					},
				),
			);
		});
	});

	describe("flatMapOkayUntil", () => {
		it("should be equivalent to multiple flatMapOkay calls", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.integer({ min: 1 }), fc.anything()),
					fc.constant((n: number) => Task.okay(collatz(n))),
					async <A, B, E>(m: Task<A, E>, k: (a: A) => Task<Result<B, A>, E>) => {
						const f = (x: Result<B, A>): Task<B, E> =>
							x.isOkay ? Task.okay(x.value) : k(x.value).flatMapOkay(f);
						expect(await spawn(m.flatMapOkayUntil(k))).toStrictEqual(
							await spawn(m.flatMapOkay(k).flatMapOkay(f)),
						);
					},
				),
			);
		});
	});

	describe("flatMapFailUntil", () => {
		it("should be equivalent to multiple flatMapFail calls", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.integer({ min: 1 })),
					fc.constant((n: number) => Task.fail(collatz(n))),
					async <A, E, F>(m: Task<A, E>, c: (x: E) => Task<A, Result<F, E>>) => {
						const g = (y: Result<F, E>): Task<A, F> =>
							y.isOkay ? Task.fail(y.value) : c(y.value).flatMapFail(g);
						expect(await spawn(m.flatMapFailUntil(c))).toStrictEqual(
							await spawn(m.flatMapFail(c).flatMapFail(g)),
						);
					},
				),
			);
		});
	});

	describe("commute", () => {
		it("should be its own inverse", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(task(fc.anything(), fc.anything()), async <A, E>(m: Task<A, E>) => {
					expect(await spawn(m.commute().commute())).toStrictEqual(await spawn(m));
				}),
			);
		});
	});

	describe("effectMap", () => {
		it("should agree with effect", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					fc.func(fc.anything()),
					async <A, B, E>(m: Task<A, E>, f: (a: A) => B) => {
						expect(
							await spawn(
								Task.fromGenerator(function* () {
									const b: B = yield* m.effectMap(f);
									return b;
								}),
							),
						).toStrictEqual(
							await spawn(
								Task.fromGenerator(function* () {
									const b: B = f(yield* m.effect());
									return b;
								}),
							),
						);
					},
				),
			);
		});
	});

	describe("fromGenerator", () => {
		it("should be equivalent to multiple flatMap calls", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.integer({ min: 1 }), fc.anything()),
					fc.constant(isPowerOfTwo),
					fc.constant((n: number) => Task.okay(hotpo(n))),
					fc.func(task(fc.anything(), fc.anything())),
					async <A, B, E>(
						m: Task<A, E>,
						p: (a: A) => boolean,
						f: (a: A) => Task<A, E>,
						g: (a: A) => Task<B, E>,
					) => {
						expect(
							await spawn(
								Task.fromGenerator(function* () {
									let a: A = yield* m.effect();
									while (!p(a)) a = yield* f(a).effect();
									const b: B = yield* g(a).effect();
									return b;
								}),
							),
						).toStrictEqual(
							await spawn(
								m.flatMapOkayUntil((a) => (p(a) ? g(a).mapOkay(Okay.of) : f(a).mapOkay(Fail.of))),
							),
						);
					},
				),
			);
		});

		it("should throw the value when the generator yields Task.fail", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					task(fc.anything(), fc.anything()),
					task(fc.anything(), fc.anything()),
					async <A, E>(m: Task<A, E>, n: Task<A, E>) => {
						expect(
							await spawn(
								Task.fromGenerator(function* () {
									try {
										const a: A = yield* m.effect();
										return a;
									} catch {
										const a: A = yield* n.effect();
										return a;
									}
								}),
							),
						).toStrictEqual(await spawn(m.flatMapFail(() => n)));
					},
				),
			);
		});

		it("should return Fail when the generator throws an Exception", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(fc.anything(), fc.anything()),
					fc.anything(),
					async <A, E>(m: Result<A, E>, x: E) => {
						expect(
							await spawn(
								Task.fromGenerator(function* () {
									if (m.isOkay) throw x;
									const a: A = yield* m.toTask<A, E>().effect();
									return a;
								}),
							),
						).toStrictEqual(await spawn(m.isOkay ? Task.fail(x) : m.toTask<A, E>()));
					},
				),
			);
		});

		it("should return Okay when the generator returns", async () => {
			expect.assertions(100);

			await fc.assert(
				fc.asyncProperty(
					result(fc.anything(), fc.anything()),
					fc.anything(),
					async <A, E>(m: Result<A, E>, a: A) => {
						expect(
							await spawn(
								Task.fromGenerator(function* () {
									if (m.isFail) return a;
									const b: A = yield* m.toTask<A, E>().effect();
									return b;
								}),
							),
						).toStrictEqual(await spawn(m.isFail ? Task.okay(a) : m.toTask<A, E>()));
					},
				),
			);
		});
	});
});
