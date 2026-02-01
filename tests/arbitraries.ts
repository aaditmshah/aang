import fc from "fast-check";

import type { Option } from "../src/option.js";
import type { Ordering } from "../src/ordering.js";
import type { Result } from "../src/result.js";

import { All, Any, Bool } from "../src/bool.js";
import { DateTime } from "../src/datetime.js";
import { Double } from "../src/double.js";
import { Integer, Product, Sum } from "../src/integer.js";
import { None, Some } from "../src/option.js";
import { Pair } from "../src/pair.js";
import { Fail, Okay } from "../src/result.js";
import { Task } from "../src/task.js";
import { Text } from "../src/text.js";

export const bool: fc.Arbitrary<Bool> = fc.boolean().map(Bool.of);

export const any: fc.Arbitrary<Any> = fc.boolean().map(Any.of);

export const all: fc.Arbitrary<All> = fc.boolean().map(All.of);

export const datetime: fc.Arbitrary<DateTime> = fc
	.date({ min: new Date(0), max: new Date(9), noInvalidDate: false })
	.map(DateTime.of);

export const double: fc.Arbitrary<Double> = fc
	.oneof(
		fc.nat(9),
		fc.constant(-0),
		fc.constant(Number.NaN),
		fc.constant(Number.POSITIVE_INFINITY),
		fc.constant(Number.NEGATIVE_INFINITY),
	)
	.map(Double.of);

export const integer: fc.Arbitrary<Integer> = fc.bigUint(9n).map(Integer.of);

export const sum: fc.Arbitrary<Sum> = fc.bigUint().map(Sum.of);

export const product: fc.Arbitrary<Product> = fc.bigUint().map(Product.of);

export const text: fc.Arbitrary<Text> = fc.string().map(Text.of);

export const some = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Some<A>> => a.map(Some.of);

export const none: fc.Arbitrary<None> = fc.constant(None.instance);

export const option = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Option<A>> => fc.oneof(some(a), none);

export const okay = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Okay<A>> => a.map(Okay.of);

export const fail = <E>(b: fc.Arbitrary<E>): fc.Arbitrary<Fail<E>> => b.map(Fail.of);

export const result = <A, E>(a: fc.Arbitrary<A>, b: fc.Arbitrary<E>): fc.Arbitrary<Result<A, E>> =>
	fc.oneof(okay(a), fail(b));

export const okayTask = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Task<A, never>> =>
	a.map((a) =>
		Task.of((k) => {
			const x = setImmediate(() => k(new Okay(a)));
			return () => clearImmediate(x);
		}),
	);

export const failTask = <E>(b: fc.Arbitrary<E>): fc.Arbitrary<Task<never, E>> =>
	b.map((b) =>
		Task.of((k) => {
			const x = setImmediate(() => k(new Fail(b)));
			return () => clearImmediate(x);
		}),
	);

export const task = <A, E>(a: fc.Arbitrary<A>, b: fc.Arbitrary<E>): fc.Arbitrary<Task<A, E>> =>
	fc.oneof(a.map(Task.okay), b.map(Task.fail), okayTask(a), failTask(b));

export const pair = <A, B>(a: fc.Arbitrary<A>, b: fc.Arbitrary<B>): fc.Arbitrary<Pair<A, B>> =>
	a.chain((a) => b.map((b) => new Pair(a, b)));

export const ordering: fc.Arbitrary<Ordering> = fc.oneof(
	fc.constant("<" as const),
	fc.constant("=" as const),
	fc.constant(">" as const),
);
