import type { Option } from "./option.js";
import { None, Some } from "./option.js";

export const fromNullable = <A>(value: A): Option<NonNullable<A>> =>
  value == null ? None.instance : new Some(value);

export const fromFalsy = <A>(value: A): Option<NonNullable<A>> =>
  value ? new Some(value) : None.instance;

export function fromValue<A, B extends A>(
  value: A,
  predicate: (value: A) => value is B,
): Option<B>;
export function fromValue<A>(
  value: A,
  predicate: (value: A) => boolean,
): Option<A>;
export function fromValue<A>(
  value: A,
  predicate: (value: A) => boolean,
): Option<A> {
  return predicate(value) ? new Some(value) : None.instance;
}

// TODO: <A, B>(getGenerator: () => Generator<Option<A>, B, A>) => Option<B>
export const fromGenerator = <A>(
  getGenerator: () => Generator<Option<unknown>, A, unknown>,
): Option<A> => {
  const generator = getGenerator();

  let result = generator.next();

  while (!result.done) {
    const option = result.value;
    if (option.isNone) return None.instance;
    result = generator.next(option.value);
  }

  return new Some(result.value);
};
