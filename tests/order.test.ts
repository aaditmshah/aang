import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import type { Option } from "../src/option.js";
import { None, OptionTotalOrder, Some } from "../src/option.js";
import type { PartialOrder, Setoid, TotalOrder } from "../src/order.js";
import {
  BigIntOrder,
  BooleanOrder,
  DateOrder,
  NumberOrder,
  StringOrder,
} from "../src/order.js";
import type { Ordering } from "../src/ordering.js";

import { option } from "./arbitraries.js";

const testSetoid = <A>(
  name: string,
  value: fc.Arbitrary<A>,
  setoid: Setoid<A>,
): void => {
  const { isSame, isNotSame } = setoid;

  const isSameReflexivity = (x: A): void => {
    expect(isSame(x, x)).toStrictEqual(true);
  };

  const isSameSymmetry = (x: A, y: A): void => {
    expect(isSame(x, y)).toStrictEqual(isSame(y, x));
  };

  const isSameTransitivity = (x: A, y: A, z: A): void => {
    expect(isSame(x, z)).toStrictEqual(
      (isSame(x, y) && isSame(y, z)) || isSame(x, z),
    );
  };

  const isSameExtensionality = <B>(x: A, y: A, f: (a: A) => B): void => {
    expect(f(x)).toStrictEqual(f(isSame(x, y) ? y : x));
  };

  const isNotSameDefinition = (x: A, y: A): void => {
    expect(isNotSame(x, y)).toStrictEqual(!isSame(x, y));
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

const testPartialOrder = <A>(
  name: string,
  value: fc.Arbitrary<A>,
  order: PartialOrder<A>,
): void => {
  const { isLess, isNotLess, isMore, isNotMore, compare, ...setoid } = order;

  const { isSame } = setoid;

  testSetoid(name, value, setoid);

  const isLessIrreflexivity = (x: A): void => {
    expect(isLess(x, x)).toStrictEqual(false);
  };

  const isLessTransitive = (x: A, y: A, z: A): void => {
    expect(isLess(x, z)).toStrictEqual(
      (isLess(x, y) && isLess(y, z)) || isLess(x, z),
    );
  };

  const isLessDuality = (x: A, y: A): void => {
    expect(isLess(x, y)).toStrictEqual(isMore(y, x));
  };

  const isNotLessDefinition = (x: A, y: A): void => {
    expect(isNotLess(x, y)).toStrictEqual(isMore(x, y) || isSame(x, y));
  };

  const isMoreIrreflexivity = (x: A): void => {
    expect(isMore(x, x)).toStrictEqual(false);
  };

  const isMoreTransitive = (x: A, y: A, z: A): void => {
    expect(isMore(x, z)).toStrictEqual(
      (isMore(x, y) && isMore(y, z)) || isMore(x, z),
    );
  };

  const isMoreDuality = (x: A, y: A): void => {
    expect(isMore(x, y)).toStrictEqual(isLess(y, x));
  };

  const isNotMoreDefinition = (x: A, y: A): void => {
    expect(isNotMore(x, y)).toStrictEqual(isLess(x, y) || isSame(x, y));
  };

  const compareIsSame = (x: A, y: A): void => {
    if (isSame(x, y)) {
      expect(compare(x, y)).toStrictEqual(new Some("="));
    } else {
      expect(compare(x, y)).not.toStrictEqual(new Some("="));
    }
  };

  const compareIsLess = (x: A, y: A): void => {
    if (isLess(x, y)) {
      expect(compare(x, y)).toStrictEqual(new Some("<"));
    } else {
      expect(compare(x, y)).not.toStrictEqual(new Some("<"));
    }
  };

  const compareIsMore = (x: A, y: A): void => {
    if (isMore(x, y)) {
      expect(compare(x, y)).toStrictEqual(new Some(">"));
    } else {
      expect(compare(x, y)).not.toStrictEqual(new Some(">"));
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

const testTotalOrder = <A>(
  name: string,
  value: fc.Arbitrary<A>,
  order: TotalOrder<A>,
): void => {
  const { max, min, clamp, ...partialOrder } = order;

  const { compare } = partialOrder;

  testPartialOrder(name, value, partialOrder);

  const maxDefinition = (x: A, y: A): void => {
    const ordering = compare(x, y);
    if (ordering.isNone) expect(max(x, y)).toStrictEqual(max(x, y));
    else expect(max(x, y)).toStrictEqual(ordering.value === "<" ? y : x);
  };

  const minDefinition = (x: A, y: A): void => {
    const ordering = compare(x, y);
    if (ordering.isNone) expect(max(x, y)).toStrictEqual(max(x, y));
    else expect(min(x, y)).toStrictEqual(ordering.value === ">" ? y : x);
  };

  const clampDefinition = (value: A, lower: A, upper: A): void => {
    expect(clamp(value, lower, upper)).toStrictEqual(
      min(max(value, lower), upper),
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

class UnknownOrder implements PartialOrder<unknown> {
  public readonly isSame: (x: unknown, y: unknown) => boolean = Object.is;

  public readonly isNotSame = (x: unknown, y: unknown): boolean =>
    !this.isSame(x, y);

  public readonly isLess: (x: unknown, y: unknown) => boolean = () => false;

  public readonly isNotLess: (x: unknown, y: unknown) => boolean = Object.is;

  public readonly isMore: (x: unknown, y: unknown) => boolean = () => false;

  public readonly isNotMore: (x: unknown, y: unknown) => boolean = Object.is;

  public readonly compare = (x: unknown, y: unknown): Option<Ordering> =>
    this.isSame(x, y) ? new Some("=") : None.instance;

  public static readonly instance = new UnknownOrder();
}

const number = fc.oneof(
  fc.nat(9),
  fc.constant(-0),
  fc.constant(Number.NaN),
  fc.constant(Number.POSITIVE_INFINITY),
  fc.constant(Number.NEGATIVE_INFINITY),
);

testPartialOrder("unknown", fc.anything(), UnknownOrder.instance);
testTotalOrder("string", fc.string(), StringOrder.instance);
testTotalOrder("number", number, NumberOrder.instance);
testTotalOrder("bigint", fc.bigUint(9n), BigIntOrder.instance);
testTotalOrder("boolean", fc.boolean(), BooleanOrder.instance);
testTotalOrder(
  "Date",
  fc.date({
    min: new Date(0),
    max: new Date(9),
    noInvalidDate: false,
  }),
  DateOrder.instance,
);

testTotalOrder(
  "Option<number>",
  option(number),
  new OptionTotalOrder(NumberOrder.instance),
);
