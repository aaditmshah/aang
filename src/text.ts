import type { Option } from "./option.js";
import { Some } from "./option.js";
import type { TotalOrder } from "./order.js";
import type { Ordering } from "./ordering.js";

export class Text implements TotalOrder<Text> {
  public constructor(public readonly value: string) {}

  public static of(value: string): Text {
    return new Text(value);
  }

  public isSame(this: Text, that: Text): boolean {
    return this.value === that.value;
  }

  public isNotSame(this: Text, that: Text): boolean {
    return this.value !== that.value;
  }

  public isLess(this: Text, that: Text): boolean {
    return this.value < that.value;
  }

  public isNotLess(this: Text, that: Text): boolean {
    return this.value >= that.value;
  }

  public isMore(this: Text, that: Text): boolean {
    return this.value > that.value;
  }

  public isNotMore(this: Text, that: Text): boolean {
    return this.value <= that.value;
  }

  public compare(this: Text, that: Text): Option<Ordering> {
    if (this.value < that.value) return new Some("<");
    if (this.value > that.value) return new Some(">");
    return new Some("=");
  }

  public max(this: Text, that: Text): Text {
    return this.value >= that.value ? this : that;
  }

  public min(this: Text, that: Text): Text {
    return this.value <= that.value ? this : that;
  }

  public clamp(this: Text, lower: Text, upper: Text): Text {
    return this.max(lower).min(upper);
  }
}
