export interface Semigroup<in out A> {
  append: (this: A, that: A) => A;
}
