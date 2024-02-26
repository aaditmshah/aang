import type { Option } from "./option.js";
import { None, Some } from "./option.js";
import type { Ordering } from "./ordering.js";

export interface Setoid<in A> {
  readonly isSame: (x: A, y: A) => boolean;

  readonly isNotSame: (x: A, y: A) => boolean;
}

export interface PartialOrder<in A> extends Setoid<A> {
  readonly isLess: (x: A, y: A) => boolean;

  readonly isNotLess: (x: A, y: A) => boolean;

  readonly isMore: (x: A, y: A) => boolean;

  readonly isNotMore: (x: A, y: A) => boolean;

  readonly compare: (x: A, y: A) => Option<Ordering>;
}

export interface TotalOrder<in out A> extends PartialOrder<A> {
  readonly max: (x: A, y: A) => A;

  readonly min: (x: A, y: A) => A;

  readonly clamp: (value: A, lower: A, upper: A) => A;
}

export class StringOrder implements TotalOrder<string> {
  public readonly isSame = (x: string, y: string): boolean => x === y;

  public readonly isNotSame = (x: string, y: string): boolean => x !== y;

  public readonly isLess = (x: string, y: string): boolean => x < y;

  public readonly isNotLess = (x: string, y: string): boolean => x >= y;

  public readonly isMore = (x: string, y: string): boolean => x > y;

  public readonly isNotMore = (x: string, y: string): boolean => x <= y;

  public readonly compare = (x: string, y: string): Option<Ordering> =>
    new Some(x < y ? "<" : x > y ? ">" : "=");

  public readonly max = (x: string, y: string): string => (x >= y ? x : y);

  public readonly min = (x: string, y: string): string => (x <= y ? x : y);

  public readonly clamp = (
    value: string,
    lower: string,
    upper: string,
  ): string => this.min(this.max(value, lower), upper);

  public static readonly instance = new StringOrder();
}

export class NumberOrder implements TotalOrder<number> {
  public readonly isSame: (x: number, y: number) => boolean = Object.is;

  public readonly isNotSame = (x: number, y: number): boolean =>
    !this.isSame(x, y);

  public readonly isLess = (x: number, y: number): boolean => x < y;

  public readonly isNotLess = (x: number, y: number): boolean =>
    x > y || this.isSame(x, y);

  public readonly isMore = (x: number, y: number): boolean => x > y;

  public readonly isNotMore = (x: number, y: number): boolean =>
    x < y || this.isSame(x, y);

  public readonly compare = (x: number, y: number): Option<Ordering> => {
    if (this.isSame(x, y)) return new Some("=");
    if (x < y) return new Some("<");
    if (x > y) return new Some(">");
    return None.instance;
  };

  public readonly max: (x: number, y: number) => number = Math.max;

  public readonly min: (x: number, y: number) => number = Math.min;

  public readonly clamp = (
    value: number,
    lower: number,
    upper: number,
  ): number => this.min(this.max(value, lower), upper);

  public static readonly instance = new NumberOrder();
}

export class BigIntOrder implements TotalOrder<bigint> {
  public readonly isSame = (x: bigint, y: bigint): boolean => x === y;

  public readonly isNotSame = (x: bigint, y: bigint): boolean => x !== y;

  public readonly isLess = (x: bigint, y: bigint): boolean => x < y;

  public readonly isNotLess = (x: bigint, y: bigint): boolean => x >= y;

  public readonly isMore = (x: bigint, y: bigint): boolean => x > y;

  public readonly isNotMore = (x: bigint, y: bigint): boolean => x <= y;

  public readonly compare = (x: bigint, y: bigint): Option<Ordering> =>
    new Some(x < y ? "<" : x > y ? ">" : "=");

  public readonly max = (x: bigint, y: bigint): bigint => (x >= y ? x : y);

  public readonly min = (x: bigint, y: bigint): bigint => (x <= y ? x : y);

  public readonly clamp = (
    value: bigint,
    lower: bigint,
    upper: bigint,
  ): bigint => this.min(this.max(value, lower), upper);

  public static readonly instance = new BigIntOrder();
}

export class BooleanOrder implements TotalOrder<boolean> {
  public readonly isSame = (x: boolean, y: boolean): boolean => x === y;

  public readonly isNotSame = (x: boolean, y: boolean): boolean => x !== y;

  public readonly isLess = (x: boolean, y: boolean): boolean => x < y;

  public readonly isNotLess = (x: boolean, y: boolean): boolean => x >= y;

  public readonly isMore = (x: boolean, y: boolean): boolean => x > y;

  public readonly isNotMore = (x: boolean, y: boolean): boolean => x <= y;

  public readonly compare = (x: boolean, y: boolean): Option<Ordering> =>
    new Some(x < y ? "<" : x > y ? ">" : "=");

  public readonly max = (x: boolean, y: boolean): boolean => (x >= y ? x : y);

  public readonly min = (x: boolean, y: boolean): boolean => (x <= y ? x : y);

  public readonly clamp = (
    value: boolean,
    lower: boolean,
    upper: boolean,
  ): boolean => this.min(this.max(value, lower), upper);

  public static readonly instance = new BooleanOrder();
}

export class DateOrder implements TotalOrder<Date> {
  public readonly isSame = (x: Date, y: Date): boolean =>
    NumberOrder.instance.isSame(x.getTime(), y.getTime());

  public readonly isNotSame = (x: Date, y: Date): boolean => !this.isSame(x, y);

  public readonly isLess = (x: Date, y: Date): boolean => x < y;

  public readonly isNotLess = (x: Date, y: Date): boolean =>
    x > y || this.isSame(x, y);

  public readonly isMore = (x: Date, y: Date): boolean => x > y;

  public readonly isNotMore = (x: Date, y: Date): boolean =>
    x < y || this.isSame(x, y);

  public readonly compare = (x: Date, y: Date): Option<Ordering> => {
    if (this.isSame(x, y)) return new Some("=");
    if (x < y) return new Some("<");
    if (x > y) return new Some(">");
    return None.instance;
  };

  public readonly max = (x: Date, y: Date): Date => {
    if (Number.isNaN(x.getTime())) return x;
    if (Number.isNaN(y.getTime())) return y;
    return x >= y ? x : y;
  };

  public readonly min = (x: Date, y: Date): Date => {
    if (Number.isNaN(x.getTime())) return x;
    if (Number.isNaN(y.getTime())) return y;
    return x <= y ? x : y;
  };

  public readonly clamp = (value: Date, lower: Date, upper: Date): Date =>
    this.min(this.max(value, lower), upper);

  public static readonly instance = new DateOrder();
}
