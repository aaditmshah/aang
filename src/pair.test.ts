import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Option } from "./option.js";
import type { Result } from "./result.js";
import type { Semigroup } from "./semigroup.js";

import { option, pair, result, task, text } from "./arbitraries.test-util.js";
import { id } from "./miscellaneous.js";
import { Some } from "./option.js";
import { Pair } from "./pair.js";
import { Fail, Okay } from "./result.js";
import { Task } from "./task.js";
import { Text } from "./text.js";
import { collatz, hotpo, isPowerOfTwo, spawn } from "./utils.test-util.js";

const fromDefinition = <A>(a: A): void => {
	expect(Pair.from(a)).toStrictEqual(Pair.of(a, a));
};

const fstDefinition = <A>(a: A): void => {
	expect(Pair.fst(a)).toStrictEqual(new Pair(a, undefined));
};

const sndDefinition = <B>(b: B): void => {
	expect(Pair.snd(b)).toStrictEqual(new Pair(undefined, b));
};

const toStringDefinition = <A, B>(m: Pair<A, B>): void => {
	try {
		expect(m.toString()).toStrictEqual(`Pair(${String(m.fst)}, ${String(m.snd)})`);
	} catch (error) {
		expect(error).toBeInstanceOf(TypeError);
	}
};

const foldEquivalence = <A, B, C>(a: A, b: B, f: (a: A, b: B) => C): void => {
	expect(new Pair(a, b).fold(f)).toStrictEqual(f(a, b));
};

const mapIdentity = <A, B>(u: Pair<A, B>): void => {
	expect(u.map(id, id)).toStrictEqual(u);
};

const mapFstIdentity = <A, B>(u: Pair<A, B>): void => {
	expect(u.mapFst(id)).toStrictEqual(u);
};

const mapSndIdentity = <A, B>(u: Pair<A, B>): void => {
	expect(u.mapSnd(id)).toStrictEqual(u);
};

const replaceFstDefinition = <A, B, C>(u: Pair<A, C>, b: B): void => {
	expect(u.replaceFst(b)).toStrictEqual(u.mapFst(() => b));
};

const replaceSndDefinition = <A, B, C>(u: Pair<A, B>, c: C): void => {
	expect(u.replaceSnd(c)).toStrictEqual(u.mapSnd(() => c));
};

const andLeftIdentity = <A, B>(v: Pair<A, B>): void => {
	expect(new Pair(undefined, undefined).and(v)).toStrictEqual(
		v.map(
			(y) => new Pair(undefined, y),
			(y) => new Pair(undefined, y),
		),
	);
};

const andRightIdentity = <A, B>(u: Pair<A, B>): void => {
	expect(u.and(new Pair(undefined, undefined))).toStrictEqual(
		u.map(
			(x) => new Pair(x, undefined),
			(x) => new Pair(x, undefined),
		),
	);
};

const andAssociativity = <A, B, C, D, E, F>(u: Pair<A, B>, v: Pair<C, D>, w: Pair<E, F>): void => {
	expect(
		u.and(v.and(w)).map(
			(x) => x.associateLeft(),
			(x) => x.associateLeft(),
		),
	).toStrictEqual(u.and(v).and(w));
};

const andFstLeftIdentity = <A, B extends Semigroup<B>>(v: Pair<A, B>, b: B): void => {
	expect(new Pair(undefined, b).andFst(v)).toStrictEqual(v.mapFst((y) => new Pair(undefined, y)));
};

const andFstRightIdentity = <A, B extends Semigroup<B>>(u: Pair<A, B>, b: B): void => {
	expect(u.andFst(new Pair(undefined, b))).toStrictEqual(u.mapFst((x) => new Pair(x, undefined)));
};

const andFstAssociativity = <A, B, C, D extends Semigroup<D>>(
	u: Pair<A, D>,
	v: Pair<B, D>,
	w: Pair<C, D>,
): void => {
	expect(u.andFst(v.andFst(w)).mapFst((x) => x.associateLeft())).toStrictEqual(
		u.andFst(v).andFst(w),
	);
};

const andThenFstDefinition = <A, B, C extends Semigroup<C>>(u: Pair<A, C>, v: Pair<B, C>): void => {
	expect(u.andThenFst(v)).toStrictEqual(u.andFst(v).mapFst((x) => x.snd));
};

const andWhenFstDefinition = <A, B, C extends Semigroup<C>>(u: Pair<A, C>, v: Pair<B, C>): void => {
	expect(u.andWhenFst(v)).toStrictEqual(u.andFst(v).mapFst((x) => x.fst));
};

const andSndLeftIdentity = <A extends Semigroup<A>, B>(v: Pair<A, B>, a: A): void => {
	expect(new Pair(a, undefined).andSnd(v)).toStrictEqual(v.mapSnd((y) => new Pair(undefined, y)));
};

const andSndRightIdentity = <A extends Semigroup<A>, B>(u: Pair<A, B>, a: A): void => {
	expect(u.andSnd(new Pair(a, undefined))).toStrictEqual(u.mapSnd((x) => new Pair(x, undefined)));
};

const andSndAssociativity = <A extends Semigroup<A>, B, C, D>(
	u: Pair<A, B>,
	v: Pair<A, C>,
	w: Pair<A, D>,
): void => {
	expect(u.andSnd(v.andSnd(w)).mapSnd((x) => x.associateLeft())).toStrictEqual(
		u.andSnd(v).andSnd(w),
	);
};

const andThenSndDefinition = <A extends Semigroup<A>, B, C>(u: Pair<A, B>, v: Pair<A, C>): void => {
	expect(u.andThenSnd(v)).toStrictEqual(u.andSnd(v).mapSnd((x) => x.snd));
};

const andWhenSndDefinition = <A extends Semigroup<A>, B, C>(u: Pair<A, B>, v: Pair<A, C>): void => {
	expect(u.andWhenSnd(v)).toStrictEqual(u.andSnd(v).mapSnd((x) => x.fst));
};

const flatMapFstLeftIdentity = <A, B, C extends Semigroup<C>>(
	a: A,
	c: C,
	k: (a: A) => Pair<B, C>,
): void => {
	expect(new Pair(a, c).flatMapFst(k)).toStrictEqual(k(a));
};

const flatMapFstRightIdentity = <A, B extends Semigroup<B>>(m: Pair<A, B>, b: B): void => {
	expect(m.flatMapFst((a) => new Pair(a, b))).toStrictEqual(m);
};

const flatMapFstAssociativity = <A, B, C, D extends Semigroup<D>>(
	m: Pair<A, D>,
	k: (a: A) => Pair<B, D>,
	h: (b: B) => Pair<C, D>,
): void => {
	expect(m.flatMapFst((a) => k(a).flatMapFst(h))).toStrictEqual(m.flatMapFst(k).flatMapFst(h));
};

const flatMapSndLeftIdentity = <A extends Semigroup<A>, B, C>(
	a: A,
	b: B,
	k: (b: B) => Pair<A, C>,
): void => {
	expect(new Pair(a, b).flatMapSnd(k)).toStrictEqual(k(b));
};

const flatMapSndRightIdentity = <A extends Semigroup<A>, B>(m: Pair<A, B>, a: A): void => {
	expect(m.flatMapSnd((b) => new Pair(a, b))).toStrictEqual(m);
};

const flatMapSndAssociativity = <A extends Semigroup<A>, B, C, D>(
	m: Pair<A, B>,
	k: (b: B) => Pair<A, C>,
	h: (c: C) => Pair<A, D>,
): void => {
	expect(m.flatMapSnd((b) => k(b).flatMapSnd(h))).toStrictEqual(m.flatMapSnd(k).flatMapSnd(h));
};

const flattenFstDefinition = <A, B extends Semigroup<B>>(u: Pair<Pair<A, B>, B>): void => {
	expect(u.flattenFst()).toStrictEqual(u.flatMapFst(id));
};

const flattenSndDefinition = <A extends Semigroup<A>, B>(u: Pair<A, Pair<A, B>>): void => {
	expect(u.flattenSnd()).toStrictEqual(u.flatMapSnd(id));
};

const flatMapFstUntilEquivalence = <A, B, C extends Semigroup<C>>(
	m: Pair<A, C>,
	c: C,
	k: (a: A) => Pair<Result<B, A>, C>,
): void => {
	const f = (x: Result<B, A>): Pair<B, C> =>
		x.isOkay ? new Pair(x.value, c) : k(x.value).flatMapFst(f);
	expect(m.flatMapFstUntil(k)).toStrictEqual(m.flatMapFst(k).flatMapFst(f));
};

const flatMapSndUntilEquivalence = <A extends Semigroup<A>, B, C>(
	m: Pair<A, B>,
	a: A,
	k: (b: B) => Pair<A, Result<C, B>>,
): void => {
	const g = (x: Result<C, B>): Pair<A, C> =>
		x.isOkay ? new Pair(a, x.value) : k(x.value).flatMapSnd(g);
	expect(m.flatMapSndUntil(k)).toStrictEqual(m.flatMapSnd(k).flatMapSnd(g));
};

const extendMapFstLeftIdentity = <A, B, C>(m: Pair<A, C>, f: (m: Pair<A, C>) => B): void => {
	expect(m.extendMapFst(f).fst).toStrictEqual(f(m));
};

const extendMapFstRightIdentity = <A, B>(m: Pair<A, B>): void => {
	expect(m.extendMapFst((m) => m.fst)).toStrictEqual(m);
};

const extendMapFstAssociativity = <A, B, C, D>(
	m: Pair<A, D>,
	f: (m: Pair<A, D>) => B,
	g: (n: Pair<B, D>) => C,
): void => {
	expect(m.extendMapFst((m) => g(m.extendMapFst(f)))).toStrictEqual(
		m.extendMapFst(f).extendMapFst(g),
	);
};

const extendMapSndLeftIdentity = <A, B, C>(m: Pair<A, B>, f: (m: Pair<A, B>) => C): void => {
	expect(m.extendMapSnd(f).snd).toStrictEqual(f(m));
};

const extendMapSndRightIdentity = <A, B>(m: Pair<A, B>): void => {
	expect(m.extendMapSnd((m) => m.snd)).toStrictEqual(m);
};

const extendMapSndAssociativity = <A, B, C, D>(
	m: Pair<A, B>,
	f: (m: Pair<A, B>) => C,
	g: (n: Pair<A, C>) => D,
): void => {
	expect(m.extendMapSnd((m) => g(m.extendMapSnd(f)))).toStrictEqual(
		m.extendMapSnd(f).extendMapSnd(g),
	);
};

const extendFstDefinition = <A, B>(u: Pair<A, B>): void => {
	expect(u.extendFst()).toStrictEqual(u.extendMapFst(id));
};

const extendSndDefinition = <A, B>(u: Pair<A, B>): void => {
	expect(u.extendSnd()).toStrictEqual(u.extendMapSnd(id));
};

const commuteInverse = <A, B>(u: Pair<A, B>): void => {
	expect(u.commute().commute()).toStrictEqual(u);
};

const andMapFstOptionDefinition = <X, A, B>(u: Pair<X, B>, f: (x: X) => Option<A>): void => {
	expect(u.andMapFstOption(f)).toStrictEqual(u.andMapOption(f, Some.of));
};

const andMapSndOptionDefinition = <Y, A, B>(u: Pair<A, Y>, g: (y: Y) => Option<B>): void => {
	expect(u.andMapSndOption(g)).toStrictEqual(u.andMapOption(Some.of, g));
};

const andOptionDefinition = <A, B>(u: Pair<Option<A>, Option<B>>): void => {
	expect(u.andOption()).toStrictEqual(u.andMapOption(id, id));
};

const andFstOptionDefinition = <A, B>(u: Pair<Option<A>, B>): void => {
	expect(u.andFstOption()).toStrictEqual(u.andMapOption(id, Some.of));
};

const andSndOptionDefinition = <A, B>(u: Pair<A, Option<B>>): void => {
	expect(u.andSndOption()).toStrictEqual(u.andMapOption(Some.of, id));
};

const andMapFstResultDefinition = <X, A, B, E>(u: Pair<X, B>, f: (x: X) => Result<A, E>): void => {
	expect(u.andMapFstResult(f)).toStrictEqual(u.andMapResult(f, Okay.of));
};

const andMapSndResultDefinition = <Y, A, B, E>(u: Pair<A, Y>, g: (y: Y) => Result<B, E>): void => {
	expect(u.andMapSndResult(g)).toStrictEqual(u.andMapResult(Okay.of, g));
};

const andResultDefinition = <A, B, E>(u: Pair<Result<A, E>, Result<B, E>>): void => {
	expect(u.andResult()).toStrictEqual(u.andMapResult(id, id));
};

const andFstResultDefinition = <A, B, E>(u: Pair<Result<A, E>, B>): void => {
	expect(u.andFstResult()).toStrictEqual(u.andMapResult(id, Okay.of));
};

const andSndResultDefinition = <A, B, E>(u: Pair<A, Result<B, E>>): void => {
	expect(u.andSndResult()).toStrictEqual(u.andMapResult(Okay.of, id));
};

const orMapFstResultDefinition = <X, A, E, F>(u: Pair<X, F>, f: (x: X) => Result<A, E>): void => {
	expect(u.orMapFstResult(f)).toStrictEqual(u.orMapResult(f, Fail.of));
};

const orMapSndResultDefinition = <Y, A, E, F>(u: Pair<E, Y>, g: (y: Y) => Result<A, F>): void => {
	expect(u.orMapSndResult(g)).toStrictEqual(u.orMapResult(Fail.of, g));
};

const orResultDefinition = <A, E, F>(u: Pair<Result<A, E>, Result<A, F>>): void => {
	expect(u.orResult()).toStrictEqual(u.orMapResult(id, id));
};

const orFstResultDefinition = <A, E, F>(u: Pair<Result<A, E>, F>): void => {
	expect(u.orFstResult()).toStrictEqual(u.orMapResult(id, Fail.of));
};

const orSndResultDefinition = <A, E, F>(u: Pair<E, Result<A, F>>): void => {
	expect(u.orSndResult()).toStrictEqual(u.orMapResult(Fail.of, id));
};

const andMapFstTaskDefinition = async <X, A, B, E>(
	m: Pair<X, B>,
	f: (x: X) => Task<A, E>,
): Promise<void> => {
	expect(await spawn(m.andMapFstTask(f))).toStrictEqual(await spawn(m.andMapTask(f, Task.okay)));
};

const andMapSndTaskDefinition = async <Y, A, B, E>(
	m: Pair<A, Y>,
	g: (y: Y) => Task<B, E>,
): Promise<void> => {
	expect(await spawn(m.andMapSndTask(g))).toStrictEqual(await spawn(m.andMapTask(Task.okay, g)));
};

const andTaskDefinition = async <A, B, E>(m: Pair<Task<A, E>, Task<B, E>>): Promise<void> => {
	expect(await spawn(m.andTask())).toStrictEqual(await spawn(m.andMapTask(id, id)));
};

const andFstTaskDefinition = async <A, B, E>(m: Pair<Task<A, E>, B>): Promise<void> => {
	expect(await spawn(m.andFstTask())).toStrictEqual(await spawn(m.andMapTask(id, Task.okay)));
};

const andSndTaskDefinition = async <A, B, E>(m: Pair<A, Task<B, E>>): Promise<void> => {
	expect(await spawn(m.andSndTask())).toStrictEqual(await spawn(m.andMapTask(Task.okay, id)));
};

const orMapFstTaskDefinition = async <X, A, E, F>(
	m: Pair<X, F>,
	f: (x: X) => Task<A, E>,
): Promise<void> => {
	expect(await spawn(m.orMapFstTask(f))).toStrictEqual(await spawn(m.orMapTask(f, Task.fail)));
};

const orMapSndTaskDefinition = async <Y, A, E, F>(
	m: Pair<E, Y>,
	g: (y: Y) => Task<A, F>,
): Promise<void> => {
	expect(await spawn(m.orMapSndTask(g))).toStrictEqual(await spawn(m.orMapTask(Task.fail, g)));
};

const orTaskDefinition = async <A, E, F>(m: Pair<Task<A, E>, Task<A, F>>): Promise<void> => {
	expect(await spawn(m.orTask())).toStrictEqual(await spawn(m.orMapTask(id, id)));
};

const orFstTaskDefinition = async <A, E, F>(m: Pair<Task<A, E>, F>): Promise<void> => {
	expect(await spawn(m.orFstTask())).toStrictEqual(await spawn(m.orMapTask(id, Task.fail)));
};

const orSndTaskDefinition = async <A, E, F>(m: Pair<E, Task<A, F>>): Promise<void> => {
	expect(await spawn(m.orSndTask())).toStrictEqual(await spawn(m.orMapTask(Task.fail, id)));
};

const distributeMapFstDefinition = <X, A, B, C>(u: Pair<X, C>, f: (x: X) => Pair<A, B>): void => {
	expect(u.distributeMapFst(f)).toStrictEqual(u.distributeMap(f, Pair.from));
};

const distributeMapSndDefinition = <Y, A, B, C>(u: Pair<A, Y>, g: (y: Y) => Pair<B, C>): void => {
	expect(u.distributeMapSnd(g)).toStrictEqual(u.distributeMap(Pair.from, g));
};

const distributeDefinition = <A, B, C, D>(u: Pair<Pair<A, B>, Pair<C, D>>): void => {
	expect(u.distribute()).toStrictEqual(u.distributeMap(id, id));
};

const distributeFstDefinition = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
	expect(u.distributeFst()).toStrictEqual(u.distributeMap(id, Pair.from));
};

const distributeSndDefinition = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
	expect(u.distributeSnd()).toStrictEqual(u.distributeMap(Pair.from, id));
};

const exchangeMapSndDefinition = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
	expect(u.exchangeMapSnd(id)).toStrictEqual(u.exchangeSnd());
};

const associateMapLeftDefinition = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
	expect(u.associateMapLeft(id)).toStrictEqual(u.associateLeft());
};

const exchangeSndInverse = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
	expect(u.exchangeSnd().exchangeSnd()).toStrictEqual(u);
};

const associateLeftInverse = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
	expect(u.associateRight().associateLeft()).toStrictEqual(u);
};

const exchangeMapFstDefinition = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
	expect(u.exchangeMapFst(id)).toStrictEqual(u.exchangeFst());
};

const associateMapRightDefinition = <A, B, C>(u: Pair<Pair<A, B>, C>): void => {
	expect(u.associateMapRight(id)).toStrictEqual(u.associateRight());
};

const exchangeFstInverse = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
	expect(u.exchangeFst().exchangeFst()).toStrictEqual(u);
};

const associateRightInverse = <A, B, C>(u: Pair<A, Pair<B, C>>): void => {
	expect(u.associateLeft().associateRight()).toStrictEqual(u);
};

const distributeMapOkayDefinition = <A, B, C>(u: Pair<A, Result<B, C>>): void => {
	expect(u.distributeMapOkay(id)).toStrictEqual(u.distributeOkay());
};

const distributeOkayInverse = <A, B, C>(u: Pair<A, Result<B, C>>): void => {
	expect(u.distributeOkay().collectSnd()).toStrictEqual(u);
};

const distributeMapFailDefinition = <A, B, C>(u: Pair<Result<A, B>, C>): void => {
	expect(u.distributeMapFail(id)).toStrictEqual(u.distributeFail());
};

const distributeFailInverse = <A, B, C>(u: Pair<Result<A, B>, C>): void => {
	expect(u.distributeFail().collectFst()).toStrictEqual(u);
};

const scatterOkayDefinition = async <A, B, C>(m: Pair<A, Task<B, C>>): Promise<void> => {
	expect(await spawn(m.scatterOkay())).toStrictEqual(await spawn(m.scatterMapOkay(id)));
};

const scatterFailDefinition = async <A, B, C>(m: Pair<Task<A, B>, C>): Promise<void> => {
	expect(await spawn(m.scatterFail())).toStrictEqual(await spawn(m.scatterMapFail(id)));
};

const valuesDefinition = <A, B>(a: A, b: B): void => {
	expect(new Pair(a, b).values()).toStrictEqual([a, b]);
};

const effectMapDefinition = <A, B, C extends Semigroup<C>>(
	c: C,
	m: Pair<A, C>,
	f: (a: A) => B,
): void => {
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
};

const fromGeneratorEquivalence = <A, B, C extends Semigroup<C>>(
	c: C,
	m: Pair<A, C>,
	p: (a: A) => boolean,
	f: (a: A) => Pair<A, C>,
	g: (a: A) => Pair<B, C>,
): void => {
	expect(
		Pair.fromGenerator(c, function* () {
			let a: A = yield* m.effect();
			while (!p(a)) a = yield* f(a).effect();
			const b: B = yield* g(a).effect();
			return b;
		}),
	).toStrictEqual(m.flatMapFstUntil((a) => (p(a) ? g(a).mapFst(Okay.of) : f(a).mapFst(Fail.of))));
};

describe("Pair", () => {
	describe("from", () => {
		it("should agree with Pair.of", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), fromDefinition));
		});
	});

	describe("fst", () => {
		it("should return a pair of the value and undefined", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), fstDefinition));
		});
	});

	describe("snd", () => {
		it("should return a pair of undefined and the value", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), sndDefinition));
		});
	});

	describe("toString", () => {
		it("should convert the Pair to a string", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), toStringDefinition));
		});
	});

	describe("fold", () => {
		it("should fold the Pair", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), fc.anything(), fc.func(fc.anything()), foldEquivalence));
		});
	});

	describe("map", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), mapIdentity));
		});
	});

	describe("mapFst", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), mapFstIdentity));
		});
	});

	describe("mapSnd", () => {
		it("should preserve identity morphisms", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), mapSndIdentity));
		});
	});

	describe("replaceFst", () => {
		it("should agree with mapFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), fc.anything(), replaceFstDefinition),
			);
		});
	});

	describe("replaceSnd", () => {
		it("should agree with mapSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), fc.anything()), fc.anything(), replaceSndDefinition),
			);
		});
	});

	describe("and", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), andLeftIdentity));
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), andRightIdentity));
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					pair(fc.anything(), fc.anything()),
					pair(fc.anything(), fc.anything()),
					andAssociativity,
				),
			);
		});
	});

	describe("andFst", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), text), fc.constant(new Text("")), andFstLeftIdentity),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), text), fc.constant(new Text("")), andFstRightIdentity),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), text),
					pair(fc.anything(), text),
					pair(fc.anything(), text),
					andFstAssociativity,
				),
			);
		});
	});

	describe("andThenFst", () => {
		it("should agree with andFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), text), pair(fc.anything(), text), andThenFstDefinition),
			);
		});
	});

	describe("andWhenFst", () => {
		it("should agree with andFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), text), pair(fc.anything(), text), andWhenFstDefinition),
			);
		});
	});

	describe("andSnd", () => {
		it("should have a left identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(text, fc.anything()), fc.constant(new Text("")), andSndLeftIdentity),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(text, fc.anything()), fc.constant(new Text("")), andSndRightIdentity),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, fc.anything()),
					pair(text, fc.anything()),
					pair(text, fc.anything()),
					andSndAssociativity,
				),
			);
		});
	});

	describe("andThenSnd", () => {
		it("should agree with andSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(text, fc.anything()), pair(text, fc.anything()), andThenSndDefinition),
			);
		});
	});

	describe("andWhenSnd", () => {
		it("should agree with andSnd", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(text, fc.anything()), pair(text, fc.anything()), andWhenSndDefinition),
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
					flatMapFstLeftIdentity,
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), text), fc.constant(new Text("")), flatMapFstRightIdentity),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), text),
					fc.func(pair(fc.anything(), text)),
					fc.func(pair(fc.anything(), text)),
					flatMapFstAssociativity,
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
					flatMapSndLeftIdentity,
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(text, fc.anything()), fc.constant(new Text("")), flatMapSndRightIdentity),
			);
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(text, fc.anything()),
					fc.func(pair(text, fc.anything())),
					fc.func(pair(text, fc.anything())),
					flatMapSndAssociativity,
				),
			);
		});
	});

	describe("flattenFst", () => {
		it("should agree with flatMapFst", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(pair(fc.anything(), text), text), flattenFstDefinition));
		});
	});

	describe("flattenSnd", () => {
		it("should agree with flatMapSnd", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(text, pair(text, fc.anything())), flattenSndDefinition));
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
					flatMapFstUntilEquivalence,
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
					flatMapSndUntilEquivalence,
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
					extendMapFstLeftIdentity,
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), extendMapFstRightIdentity));
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(fc.anything()),
					fc.func(fc.anything()),
					extendMapFstAssociativity,
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
					extendMapSndLeftIdentity,
				),
			);
		});

		it("should have a right identity", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), extendMapSndRightIdentity));
		});

		it("should be associative", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(fc.anything()),
					fc.func(fc.anything()),
					extendMapSndAssociativity,
				),
			);
		});
	});

	describe("extendFst", () => {
		it("should agree with extendMapFst", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), extendFstDefinition));
		});
	});

	describe("extendSnd", () => {
		it("should agree with extendMapSnd", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), extendSndDefinition));
		});
	});

	describe("commute", () => {
		it("should be its own inverse", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), fc.anything()), commuteInverse));
		});
	});

	describe("andMapFstOption", () => {
		it("should agree with andMapOption", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(option(fc.anything())),
					andMapFstOptionDefinition,
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
					andMapSndOptionDefinition,
				),
			);
		});
	});

	describe("andOption", () => {
		it("should agree with andMapOption", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(option(fc.anything()), option(fc.anything())), andOptionDefinition),
			);
		});
	});

	describe("andFstOption", () => {
		it("should agree with andMapOption", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(option(fc.anything()), fc.anything()), andFstOptionDefinition));
		});
	});

	describe("andSndOption", () => {
		it("should agree with andMapOption", () => {
			expect.assertions(100);

			fc.assert(fc.property(pair(fc.anything(), option(fc.anything())), andSndOptionDefinition));
		});
	});

	describe("andMapFstResult", () => {
		it("should agree with andMapResult", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), fc.anything()),
					fc.func(result(fc.anything(), fc.anything())),
					andMapFstResultDefinition,
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
					andMapSndResultDefinition,
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
					andResultDefinition,
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
					andFstResultDefinition,
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
					andSndResultDefinition,
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
					orMapFstResultDefinition,
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
					orMapSndResultDefinition,
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
					orResultDefinition,
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
					orFstResultDefinition,
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
					orSndResultDefinition,
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
					andMapFstTaskDefinition,
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
					andMapSndTaskDefinition,
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
					andTaskDefinition,
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
					andFstTaskDefinition,
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
					andSndTaskDefinition,
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
					orMapFstTaskDefinition,
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
					orMapSndTaskDefinition,
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
					orTaskDefinition,
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
					orFstTaskDefinition,
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
					orSndTaskDefinition,
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
					distributeMapFstDefinition,
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
					distributeMapSndDefinition,
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
					distributeDefinition,
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
					distributeFstDefinition,
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
					distributeSndDefinition,
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
					exchangeMapSndDefinition,
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
					associateMapLeftDefinition,
				),
			);
		});
	});

	describe("exchangeSnd", () => {
		it("should be its own inverse", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(pair(fc.anything(), fc.anything()), fc.anything()), exchangeSndInverse),
			);
		});
	});

	describe("associateLeft", () => {
		it("should be the inverse of associateRight", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(pair(fc.anything(), fc.anything()), fc.anything()), associateLeftInverse),
			);
		});
	});

	describe("exchangeMapFst", () => {
		it("should agree with exchangeFst", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), pair(fc.anything(), fc.anything())),
					exchangeMapFstDefinition,
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
					associateMapRightDefinition,
				),
			);
		});
	});

	describe("exchangeFst", () => {
		it("should be its own inverse", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), pair(fc.anything(), fc.anything())), exchangeFstInverse),
			);
		});
	});

	describe("associateRight", () => {
		it("should be the inverse of associateLeft", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(pair(fc.anything(), pair(fc.anything(), fc.anything())), associateRightInverse),
			);
		});
	});

	describe("distributeMapOkay", () => {
		it("should agree with distributeOkay", () => {
			expect.assertions(100);

			fc.assert(
				fc.property(
					pair(fc.anything(), result(fc.anything(), fc.anything())),
					distributeMapOkayDefinition,
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
					distributeOkayInverse,
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
					distributeMapFailDefinition,
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
					distributeFailInverse,
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
					scatterOkayDefinition,
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
					scatterFailDefinition,
				),
			);
		});
	});

	describe("values", () => {
		it("should return the values of the pair", () => {
			expect.assertions(100);

			fc.assert(fc.property(fc.anything(), fc.anything(), valuesDefinition));
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
					effectMapDefinition,
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
					fromGeneratorEquivalence,
				),
			);
		});
	});
});
