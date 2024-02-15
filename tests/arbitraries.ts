import fc from "fast-check";

import type { Option } from "../src/option.js";
import { None, Some } from "../src/option.js";
import type { Result } from "../src/result.js";
import { Fail, Okay } from "../src/result.js";

export const some = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Some<A>> =>
  a.map((value) => new Some(value));

export const none: fc.Arbitrary<None> = fc.constant(None.instance);

export const option = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Option<A>> =>
  fc.oneof(some(a), none);

export const okay = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Okay<A>> =>
  a.map((value) => new Okay(value));

export const fail = <E>(b: fc.Arbitrary<E>): fc.Arbitrary<Fail<E>> =>
  b.map((value) => new Fail(value));

export const result = <E, A>(
  a: fc.Arbitrary<A>,
  b: fc.Arbitrary<E>,
): fc.Arbitrary<Result<E, A>> => fc.oneof(okay(a), fail(b));
