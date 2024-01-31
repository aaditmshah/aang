export type Thunk<A> = () => A;

// eslint-disable-next-line @typescript-eslint/ban-types
export type NonFunction<A> = A extends Function ? never : A;

export type Expression<A> = Thunk<A> | NonFunction<A>;

export const evaluate = <A>(expression: Expression<A>): A =>
  typeof expression === "function" ? (expression as Thunk<A>)() : expression;
