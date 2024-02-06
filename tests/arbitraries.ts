import fc from "fast-check";

import type { Expression, NonThunk } from "../src/expression.js";
import { Thunk, isNonThunk } from "../src/expression.js";
import type { Option } from "../src/option.js";
import { None, Some } from "../src/option.js";
import type { Result } from "../src/result.js";
import { Failure, Success } from "../src/result.js";

export const thunk = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Thunk<A>> =>
  a.map((value) => new Thunk(() => value));

export const nonThunk = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<NonThunk<A>> =>
  a.filter(isNonThunk);

export const expression = <A>(
  a: fc.Arbitrary<A>,
): fc.Arbitrary<Expression<A>> => fc.oneof(thunk(a), nonThunk(a));

export const some = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Some<A>> =>
  a.map(Some.of);

export const none: fc.Arbitrary<None> = fc.constant(None.instance);

export const option = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Option<A>> =>
  fc.oneof(some(a), none);

export const success = <A>(a: fc.Arbitrary<A>): fc.Arbitrary<Success<A>> =>
  a.map(Success.of);

export const failure = <E>(b: fc.Arbitrary<E>): fc.Arbitrary<Failure<E>> =>
  b.map(Failure.of);

export const result = <E, A>(
  a: fc.Arbitrary<A>,
  b: fc.Arbitrary<E>,
): fc.Arbitrary<Result<E, A>> => fc.oneof(success(a), failure(b));
