import type { Option } from "./option.js";
import { Some } from "./option.js";
import type { TotalOrder } from "./order.js";
import type { Ordering } from "./ordering.js";
import type { Semigroup } from "./semigroup.js";

export class Bool implements TotalOrder<Bool> {
  public constructor(public readonly value: boolean) {}

  public static of(value: boolean): Bool {
    return new Bool(value);
  }

  public isSame(this: Bool, that: Bool): boolean {
    return this.value === that.value;
  }

  public isNotSame(this: Bool, that: Bool): boolean {
    return this.value !== that.value;
  }

  public isLess(this: Bool, that: Bool): boolean {
    return this.value < that.value;
  }

  public isNotLess(this: Bool, that: Bool): boolean {
    return this.value >= that.value;
  }

  public isMore(this: Bool, that: Bool): boolean {
    return this.value > that.value;
  }

  public isNotMore(this: Bool, that: Bool): boolean {
    return this.value <= that.value;
  }

  public compare(this: Bool, that: Bool): Option<Ordering> {
    if (this.value < that.value) return new Some("<");
    if (this.value > that.value) return new Some(">");
    return new Some("=");
  }

  public max(this: Bool, that: Bool): Bool {
    return this.value >= that.value ? this : that;
  }

  public min(this: Bool, that: Bool): Bool {
    return this.value <= that.value ? this : that;
  }

  public clamp(this: Bool, lower: Bool, upper: Bool): Bool {
    return this.max(lower).min(upper);
  }
}

export class Any extends Bool implements Semigroup<Any> {
  public static override of(value: boolean): Any {
    return new Any(value);
  }

  public append(this: Any, that: Any): Any {
    return new Any(this.value || that.value);
  }
}

export class All extends Bool implements Semigroup<All> {
  public static override of(value: boolean): All {
    return new All(value);
  }

  public append(this: All, that: All): All {
    return new All(this.value && that.value);
  }
}
