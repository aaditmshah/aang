import type { Option } from "./option.js";
import { Some } from "./option.js";
import type { TotalOrder } from "./order.js";
import type { Ordering } from "./ordering.js";
import type { Semigroup } from "./semigroup.js";

export class Integer implements TotalOrder<Integer> {
  public constructor(public readonly value: bigint) {}

  public static of(value: bigint): Integer {
    return new Integer(value);
  }

  public isSame(this: Integer, that: Integer): boolean {
    return this.value === that.value;
  }

  public isNotSame(this: Integer, that: Integer): boolean {
    return this.value !== that.value;
  }

  public isLess(this: Integer, that: Integer): boolean {
    return this.value < that.value;
  }

  public isNotLess(this: Integer, that: Integer): boolean {
    return this.value >= that.value;
  }

  public isMore(this: Integer, that: Integer): boolean {
    return this.value > that.value;
  }

  public isNotMore(this: Integer, that: Integer): boolean {
    return this.value <= that.value;
  }

  public compare(this: Integer, that: Integer): Option<Ordering> {
    if (this.value < that.value) return new Some("<");
    if (this.value > that.value) return new Some(">");
    return new Some("=");
  }

  public max(this: Integer, that: Integer): Integer {
    return this.value >= that.value ? this : that;
  }

  public min(this: Integer, that: Integer): Integer {
    return this.value <= that.value ? this : that;
  }

  public clamp(this: Integer, lower: Integer, upper: Integer): Integer {
    return this.max(lower).min(upper);
  }
}

export class Sum extends Integer implements Semigroup<Sum> {
  public static override of(value: bigint): Sum {
    return new Sum(value);
  }

  public append(this: Sum, that: Sum): Sum {
    return new Sum(this.value + that.value);
  }
}

export class Product extends Integer implements Semigroup<Product> {
  public static override of(value: bigint): Product {
    return new Product(value);
  }

  public append(this: Product, that: Product): Product {
    return new Product(this.value * that.value);
  }
}
