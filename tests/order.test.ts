import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { Bool } from "../src/bool.js";
import { DateTime } from "../src/datetime.js";
import { Double } from "../src/double.js";
import { Integer } from "../src/integer.js";
import type { Option } from "../src/option.js";
import { None, Some } from "../src/option.js";
import type { PartialOrder, Setoid, TotalOrder } from "../src/order.js";
import type { Ordering } from "../src/ordering.js";
import { Text } from "../src/text.js";

import { option } from "./arbitraries.js";

const testSetoid = <A extends Setoid<A>>(
  name: string,
  value: fc.Arbitrary<A>,
): void => {
  const isSameReflexivity = (x: A): void => {
    expect(x.isSame(x)).toStrictEqual(true);
  };

  const isSameSymmetry = (x: A, y: A): void => {
    expect(x.isSame(y)).toStrictEqual(y.isSame(x));
  };

  const isSameTransitivity = (x: A, y: A, z: A): void => {
    expect(x.isSame(z)).toStrictEqual(
      (x.isSame(y) && y.isSame(z)) || x.isSame(z),
    );
  };

  const isSameExtensionality = <B>(x: A, y: A, f: (a: A) => B): void => {
    expect(f(x)).toStrictEqual(f(x.isSame(y) ? y : x));
  };

  const isNotSameDefinition = (x: A, y: A): void => {
    expect(x.isNotSame(y)).toStrictEqual(!x.isSame(y));
  };

  describe(`Setoid<${name}>`, () => {
    describe("isSame", () => {
      it("should be reflexive", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, isSameReflexivity));
      });

      it("should be symmetric", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, isSameSymmetry));
      });

      it("should be transitive", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, value, isSameTransitivity));
      });

      it("should respect function extensionality", () => {
        expect.assertions(100);

        fc.assert(
          fc.property(
            value,
            value,
            fc.func(fc.anything()),
            isSameExtensionality,
          ),
        );
      });
    });

    describe("isNotSame", () => {
      it("should agree with isSame", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, isNotSameDefinition));
      });
    });
  });
};

const testPartialOrder = <A extends PartialOrder<A>>(
  name: string,
  value: fc.Arbitrary<A>,
): void => {
  testSetoid(name, value);

  const isLessIrreflexivity = (x: A): void => {
    expect(x.isLess(x)).toStrictEqual(false);
  };

  const isLessTransitive = (x: A, y: A, z: A): void => {
    expect(x.isLess(z)).toStrictEqual(
      (x.isLess(y) && y.isLess(z)) || x.isLess(z),
    );
  };

  const isLessDuality = (x: A, y: A): void => {
    expect(x.isLess(y)).toStrictEqual(y.isMore(x));
  };

  const isNotLessDefinition = (x: A, y: A): void => {
    expect(x.isNotLess(y)).toStrictEqual(x.isMore(y) || x.isSame(y));
  };

  const isMoreIrreflexivity = (x: A): void => {
    expect(x.isMore(x)).toStrictEqual(false);
  };

  const isMoreTransitive = (x: A, y: A, z: A): void => {
    expect(x.isMore(z)).toStrictEqual(
      (x.isMore(y) && y.isMore(z)) || x.isMore(z),
    );
  };

  const isMoreDuality = (x: A, y: A): void => {
    expect(x.isMore(y)).toStrictEqual(y.isLess(x));
  };

  const isNotMoreDefinition = (x: A, y: A): void => {
    expect(x.isNotMore(y)).toStrictEqual(x.isLess(y) || x.isSame(y));
  };

  const compareIsSame = (x: A, y: A): void => {
    if (x.isSame(y)) {
      expect(x.compare(y)).toStrictEqual(new Some("="));
    } else {
      expect(x.compare(y)).not.toStrictEqual(new Some("="));
    }
  };

  const compareIsLess = (x: A, y: A): void => {
    if (x.isLess(y)) {
      expect(x.compare(y)).toStrictEqual(new Some("<"));
    } else {
      expect(x.compare(y)).not.toStrictEqual(new Some("<"));
    }
  };

  const compareIsMore = (x: A, y: A): void => {
    if (x.isMore(y)) {
      expect(x.compare(y)).toStrictEqual(new Some(">"));
    } else {
      expect(x.compare(y)).not.toStrictEqual(new Some(">"));
    }
  };

  describe(`PartialOrder<${name}>`, () => {
    describe("isLess", () => {
      it("should be irreflexive", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, isLessIrreflexivity));
      });

      it("should be transitive", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, value, isLessTransitive));
      });

      it("should be the dual of isMore", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, isLessDuality));
      });
    });

    describe("isNotLess", () => {
      it("should agree with isMore or isSame", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, isNotLessDefinition));
      });
    });

    describe("isMore", () => {
      it("should be irreflexive", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, isMoreIrreflexivity));
      });

      it("should be transitive", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, value, isMoreTransitive));
      });

      it("should be the dual of isLess", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, isMoreDuality));
      });
    });

    describe("isNotMore", () => {
      it("should agree with isLess or isSame", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, isNotMoreDefinition));
      });
    });

    describe("compare", () => {
      it("should agree with isSame", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, compareIsSame));
      });

      it("should agree with isLess", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, compareIsLess));
      });

      it("should agree with isMore", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, compareIsMore));
      });
    });
  });
};

const testTotalOrder = <A extends TotalOrder<A>>(
  name: string,
  value: fc.Arbitrary<A>,
): void => {
  testPartialOrder(name, value);

  const maxDefinition = (x: A, y: A): void => {
    const ordering = x.compare(y);
    if (ordering.isNone) expect(x.max(y)).toStrictEqual(x.max(y));
    else expect(x.max(y)).toStrictEqual(ordering.value === "<" ? y : x);
  };

  const minDefinition = (x: A, y: A): void => {
    const ordering = x.compare(y);
    if (ordering.isNone) expect(x.max(y)).toStrictEqual(x.max(y));
    else expect(x.min(y)).toStrictEqual(ordering.value === ">" ? y : x);
  };

  const clampDefinition = (value: A, lower: A, upper: A): void => {
    expect(value.clamp(lower, upper)).toStrictEqual(
      value.max(lower).min(upper),
    );
  };

  describe(`TotalOrder<${name}>`, () => {
    describe("max", () => {
      it("should agree with compare", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, maxDefinition));
      });
    });

    describe("min", () => {
      it("should agree with compare", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, minDefinition));
      });
    });

    describe("clamp", () => {
      it("should agree with min and max", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, value, clampDefinition));
      });
    });
  });
};

class Unknown implements PartialOrder<Unknown> {
  public constructor(public readonly value: unknown) {}

  public static of(value: unknown): Unknown {
    return new Unknown(value);
  }

  public isSame(this: Unknown, that: Unknown): boolean {
    return Object.is(this.value, that.value);
  }

  public isNotSame(this: Unknown, that: Unknown): boolean {
    return !Object.is(this.value, that.value);
  }

  public isLess(): boolean {
    return false;
  }

  public isNotLess(this: Unknown, that: Unknown): boolean {
    return Object.is(this.value, that.value);
  }

  public isMore(): boolean {
    return false;
  }

  public isNotMore(this: Unknown, that: Unknown): boolean {
    return Object.is(this.value, that.value);
  }

  public compare(this: Unknown, that: Unknown): Option<Ordering> {
    return Object.is(this.value, that.value) ? new Some("=") : None.instance;
  }
}

const double = fc
  .oneof(
    fc.nat(9),
    fc.constant(-0),
    fc.constant(Number.NaN),
    fc.constant(Number.POSITIVE_INFINITY),
    fc.constant(Number.NEGATIVE_INFINITY),
  )
  .map(Double.of);

testPartialOrder("Unknown", fc.anything().map(Unknown.of));

testTotalOrder("Text", fc.string().map(Text.of));

testTotalOrder("Double", double);

testTotalOrder("Integer", fc.bigUint(9n).map(Integer.of));

testTotalOrder("Bool", fc.boolean().map(Bool.of));

testTotalOrder(
  "DateTime",
  fc
    .date({
      min: new Date(0),
      max: new Date(9),
      noInvalidDate: false,
    })
    .map(DateTime.of),
);

testTotalOrder("Option<Double>", option(double));
