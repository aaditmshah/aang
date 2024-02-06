export const defineThunk = <T extends Record<K, A>, K extends PropertyKey, A>(
  object: T,
  property: K,
  thunk: () => A,
  { enumerable = true, configurable = true } = {},
): void => {
  Object.defineProperty(object, property, {
    get: thunk,
    enumerable,
    configurable,
  });
};

export const defineValue = <T extends Record<K, A>, K extends PropertyKey, A>(
  object: T,
  property: K,
  value: A,
  { writable = true, enumerable = true, configurable = true } = {},
): void => {
  Object.defineProperty(object, property, {
    value,
    writable,
    enumerable,
    configurable,
  });
};

export class Thunk<out A> {
  protected readonly isThunk = true;

  public readonly value!: A;

  public constructor(thunk: () => A) {
    defineThunk(this, "value", (): A => {
      const value = thunk();
      defineValue(this, "value", value, { writable: false });
      return value;
    });
  }
}

export type NonThunk<A> = A extends Thunk<unknown> ? never : A;

export type Expression<A> = Thunk<A> | NonThunk<A>;

export const isNonThunk = <A>(value: A): value is NonThunk<A> =>
  !(value instanceof Thunk);

export const evaluate = <A>(expression: Expression<A>): A =>
  expression instanceof Thunk ? expression.value : expression;

export const fromValue = <A>(value: A): Expression<A> =>
  isNonThunk(value) ? value : new Thunk(() => value);

export const define = <T extends Record<K, A>, K extends PropertyKey, A>(
  object: T,
  property: K,
  expression: Expression<A>,
): void => {
  if (expression instanceof Thunk) {
    defineThunk(object, property, (): A => {
      const { value } = expression;
      defineValue(object, property, value, { writable: false });
      return value;
    });
  } else {
    defineValue<T, K, A>(object, property, expression, { writable: false });
  }
};
