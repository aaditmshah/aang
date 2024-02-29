import type { Option } from "./option.js";
import { None, Some } from "./option.js";
import type { TotalOrder } from "./order.js";
import type { Ordering } from "./ordering.js";

export class DateTime implements TotalOrder<DateTime> {
  public constructor(public readonly value: Date) {}

  public static of(value: Date): DateTime {
    return new DateTime(value);
  }

  public isSame(this: DateTime, that: DateTime): boolean {
    return Object.is(this.value.getTime(), that.value.getTime());
  }

  public isNotSame(this: DateTime, that: DateTime): boolean {
    return !this.isSame(that);
  }

  public isLess(this: DateTime, that: DateTime): boolean {
    return this.value < that.value;
  }

  public isNotLess(this: DateTime, that: DateTime): boolean {
    return this.value > that.value || this.isSame(that);
  }

  public isMore(this: DateTime, that: DateTime): boolean {
    return this.value > that.value;
  }

  public isNotMore(this: DateTime, that: DateTime): boolean {
    return this.value < that.value || this.isSame(that);
  }

  public compare(this: DateTime, that: DateTime): Option<Ordering> {
    if (this.isSame(that)) return new Some("=");
    if (this.value < that.value) return new Some("<");
    if (this.value > that.value) return new Some(">");
    return None.instance;
  }

  public max(this: DateTime, that: DateTime): DateTime {
    if (Number.isNaN(this.value.getTime())) return this;
    if (Number.isNaN(that.value.getTime())) return that;
    return this.value >= that.value ? this : that;
  }

  public min(this: DateTime, that: DateTime): DateTime {
    if (Number.isNaN(this.value.getTime())) return this;
    if (Number.isNaN(that.value.getTime())) return that;
    return this.value <= that.value ? this : that;
  }

  public clamp(this: DateTime, lower: DateTime, upper: DateTime): DateTime {
    return this.max(lower).min(upper);
  }
}
