import { ComparabilityError } from "./errors.js";
import type { Option } from "./option.js";
import { None, Some } from "./option.js";
import type { Ordering } from "./ordering.js";
import { isNotLess, isNotMore } from "./ordering.js";

export abstract class Setoid<in A> {
  public abstract readonly isSame: (x: A, y: A) => boolean;

  public readonly isNotSame = (x: A, y: A): boolean => !this.isSame(x, y);
}

export abstract class Order<in out A> extends Setoid<A> {
  public abstract readonly isLess: (x: A, y: A) => boolean;

  public readonly isNotLess = (x: A, y: A): boolean =>
    this.compare(x, y).isSomeAnd(isNotLess);

  public abstract readonly isMore: (x: A, y: A) => boolean;

  public readonly isNotMore = (x: A, y: A): boolean =>
    this.compare(x, y).isSomeAnd(isNotMore);

  public readonly compare = (x: A, y: A): Option<Ordering> => {
    if (this.isSame(x, y)) return new Some("=");
    if (this.isLess(x, y)) return new Some("<");
    if (this.isMore(x, y)) return new Some(">");
    return None.instance;
  };

  public readonly unsafeCompare = (x: A, y: A): Ordering =>
    this.compare(x, y).unsafeExtract(new ComparabilityError(x, y));

  public readonly max = (x: A, y: A): A =>
    isNotLess(this.unsafeCompare(x, y)) ? x : y;

  public readonly min = (x: A, y: A): A =>
    isNotMore(this.unsafeCompare(x, y)) ? x : y;

  public readonly clamp = (value: A, lower: A, upper: A): A =>
    this.min(this.max(value, lower), upper);
}

export class StringOrder extends Order<string> {
  public override readonly isSame = (x: string, y: string): boolean => x === y;

  public override readonly isNotSame = (x: string, y: string): boolean =>
    x !== y;

  public override readonly isLess = (x: string, y: string): boolean => x < y;

  public override readonly isNotLess = (x: string, y: string): boolean =>
    x >= y;

  public override readonly isMore = (x: string, y: string): boolean => x > y;

  public override readonly isNotMore = (x: string, y: string): boolean =>
    x <= y;

  public static readonly instance = new StringOrder();
}

export class NumberOrder extends Order<number> {
  public override readonly isSame: (x: number, y: number) => boolean =
    Object.is;

  public override readonly isLess = (x: number, y: number): boolean => x < y;

  public override readonly isNotLess = (x: number, y: number): boolean =>
    x >= y;

  public override readonly isMore = (x: number, y: number): boolean => x > y;

  public override readonly isNotMore = (x: number, y: number): boolean =>
    x <= y;

  public override readonly max: (x: number, y: number) => number = Math.max;

  public override readonly min: (x: number, y: number) => number = Math.min;

  public static readonly instance = new NumberOrder();
}

export class BigIntOrder extends Order<bigint> {
  public override readonly isSame = (x: bigint, y: bigint): boolean => x === y;

  public override readonly isNotSame = (x: bigint, y: bigint): boolean =>
    x !== y;

  public override readonly isLess = (x: bigint, y: bigint): boolean => x < y;

  public override readonly isNotLess = (x: bigint, y: bigint): boolean =>
    x >= y;

  public override readonly isMore = (x: bigint, y: bigint): boolean => x > y;

  public override readonly isNotMore = (x: bigint, y: bigint): boolean =>
    x <= y;

  public static readonly instance = new BigIntOrder();
}

export class BooleanOrder extends Order<boolean> {
  public override readonly isSame = (x: boolean, y: boolean): boolean =>
    x === y;

  public override readonly isNotSame = (x: boolean, y: boolean): boolean =>
    x !== y;

  public override readonly isLess = (x: boolean, y: boolean): boolean => x < y;

  public override readonly isNotLess = (x: boolean, y: boolean): boolean =>
    x >= y;

  public override readonly isMore = (x: boolean, y: boolean): boolean => x > y;

  public override readonly isNotMore = (x: boolean, y: boolean): boolean =>
    x <= y;

  public static readonly instance = new BooleanOrder();
}

export class DateOrder extends Order<Date> {
  public override readonly isSame = (x: Date, y: Date): boolean =>
    NumberOrder.instance.isSame(x.getTime(), y.getTime());

  public override readonly isNotSame = (x: Date, y: Date): boolean =>
    NumberOrder.instance.isNotSame(x.getTime(), y.getTime());

  public override readonly isLess = (x: Date, y: Date): boolean => x < y;

  public override readonly isNotLess = (x: Date, y: Date): boolean => x >= y;

  public override readonly isMore = (x: Date, y: Date): boolean => x > y;

  public override readonly isNotMore = (x: Date, y: Date): boolean => x <= y;

  public static readonly instance = new DateOrder();
}
