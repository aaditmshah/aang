import fc from "fast-check";

import type { Option } from "../src/option.js";
import { None, Some } from "../src/option.js";
import type { Ordering } from "../src/ordering.js";
import { Pair } from "../src/pair.js";
import type { Result } from "../src/result.js";
import { Fail, Okay } from "../src/result.js";

export const some = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Some<A>> =>
  a.map(Some.of);

export const none: fc.Arbitrary<None> = fc.constant(None.instance);

export const option = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Option<A>> =>
  fc.oneof(some(a), none);

export const okay = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Okay<A>> =>
  a.map(Okay.of);

export const fail = <E>(b: fc.Arbitrary<E>): fc.Arbitrary<Fail<E>> =>
  b.map(Fail.of);

export const result = <E, A>(
  a: fc.Arbitrary<A>,
  b: fc.Arbitrary<E>,
): fc.Arbitrary<Result<E, A>> => fc.oneof(okay(a), fail(b));

export const pair = <A, B>(
  a: fc.Arbitrary<A>,
  b: fc.Arbitrary<B>,
): fc.Arbitrary<Pair<A, B>> => a.chain((a) => b.map((b) => new Pair(a, b)));

export const ordering: fc.Arbitrary<Ordering> = fc.oneof(
  fc.constant("<" as const),
  fc.constant("=" as const),
  fc.constant(">" as const),
);
