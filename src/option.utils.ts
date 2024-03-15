import { NoneException } from "./exceptions.js";
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

  let result: IteratorResult<Option<unknown>, A>;

  try {
    result = generator.next();
  } catch (error) {
    if (error instanceof NoneException) return None.instance;
    throw error;
  }

  while (!result.done) {
    const option = result.value;
    try {
      result = option.isSome
        ? generator.next(option.value)
        : generator.throw(new NoneException());
    } catch (error) {
      if (error instanceof NoneException) return None.instance;
      throw error;
    }
  }

  return new Some(result.value);
};
