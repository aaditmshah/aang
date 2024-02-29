import type { Option } from "./option.js";
import type { Ordering } from "./ordering.js";

export interface Setoid<in A> {
  isSame: (this: A, that: A) => boolean;

  isNotSame: (this: A, that: A) => boolean;
}

export interface PartialOrder<in A> extends Setoid<A> {
  isLess: (this: A, that: A) => boolean;

  isNotLess: (this: A, that: A) => boolean;

  isMore: (this: A, that: A) => boolean;

  isNotMore: (this: A, that: A) => boolean;

  compare: (this: A, that: A) => Option<Ordering>;
}

export interface TotalOrder<in out A> extends PartialOrder<A> {
  max: (this: A, that: A) => A;

  min: (this: A, that: A) => A;

  clamp: (this: A, lower: A, upper: A) => A;
}
