import type { Option } from "./option.js";
import { None, Some } from "./option.js";
import type { TotalOrder } from "./order.js";
import type { Ordering } from "./ordering.js";

export class Double implements TotalOrder<Double> {
  public constructor(public readonly value: number) {}

  public static of(value: number): Double {
    return new Double(value);
  }

  public isSame(this: Double, that: Double): boolean {
    return Object.is(this.value, that.value);
  }

  public isNotSame(this: Double, that: Double): boolean {
    return !Object.is(this.value, that.value);
  }

  public isLess(this: Double, that: Double): boolean {
    return this.value < that.value;
  }

  public isNotLess(this: Double, that: Double): boolean {
    return this.value > that.value || Object.is(this.value, that.value);
  }

  public isMore(this: Double, that: Double): boolean {
    return this.value > that.value;
  }

  public isNotMore(this: Double, that: Double): boolean {
    return this.value < that.value || Object.is(this.value, that.value);
  }

  public compare(this: Double, that: Double): Option<Ordering> {
    if (Object.is(this.value, that.value)) return new Some("=");
    if (this.value < that.value) return new Some("<");
    if (this.value > that.value) return new Some(">");
    return None.instance;
  }

  public max(this: Double, that: Double): Double {
    return new Double(Math.max(this.value, that.value));
  }

  public min(this: Double, that: Double): Double {
    return new Double(Math.min(this.value, that.value));
  }

  public clamp(this: Double, lower: Double, upper: Double): Double {
    return this.max(lower).min(upper);
  }
}
