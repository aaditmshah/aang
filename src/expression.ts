export type Thunk<A> = () => A;

// eslint-disable-next-line @typescript-eslint/ban-types
export type NonFunction<A> = A extends Function ? never : A;

export type Expression<A> = Thunk<A> | NonFunction<A>;

export const isThunk = <A>(expression: Expression<A>): expression is Thunk<A> =>
  typeof expression === "function";

export const isNonFunction = <A>(value: A): value is NonFunction<A> =>
  typeof value !== "function";

export const evaluate = <A>(expression: Expression<A>): A =>
  isThunk(expression) ? expression() : expression;

export const fromValue = <A>(value: A): Expression<A> =>
  isNonFunction(value) ? value : () => value;

export const define = <T extends Record<K, A>, K extends PropertyKey, A>(
  object: T,
  property: K,
  expression: Expression<A>,
): void => {
  if (isThunk(expression)) {
    Object.defineProperty(object, property, {
      get: (): A => {
        const value = evaluate(expression);
        Object.defineProperty(object, property, { value });
        return value;
      },
      enumerable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(object, property, {
      value: expression,
      enumerable: true,
      configurable: true,
    });
  }
};
