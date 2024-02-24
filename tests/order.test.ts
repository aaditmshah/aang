import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { ComparabilityError } from "../src/errors.js";
import { Some } from "../src/option.js";
import type { Setoid } from "../src/order.js";
import {
  BigIntOrder,
  BooleanOrder,
  DateOrder,
  NumberOrder,
  Order,
  StringOrder,
} from "../src/order.js";
import * as ordering from "../src/ordering.js";

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
    if (isSame(x, y) && isSame(y, z)) {
      expect(isSame(x, z)).toStrictEqual(true);
    } else {
      expect(isSame(x, z)).toStrictEqual(expect.anything());
    }
  };

  const isSameExtensionality = <B>(x: A, y: A, f: (a: A) => B): void => {
    if (isSame(x, y)) {
      expect(f(x)).toStrictEqual(f(y));
    } else {
      expect(f(x)).toStrictEqual(f(x));
    }
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

const testOrder = <A>(
  name: string,
  value: fc.Arbitrary<A>,
  order: Order<A>,
): void => {
  const {
    isLess,
    isNotLess,
    isMore,
    isNotMore,
    compare,
    unsafeCompare,
    max,
    min,
    clamp,
    ...setoid
  } = order;

  const { isSame } = setoid;

  testSetoid(name, value, setoid);

  const isLessIrreflexivity = (x: A): void => {
    expect(isLess(x, x)).toStrictEqual(false);
  };

  const isLessTransitive = (x: A, y: A, z: A): void => {
    if (isLess(x, y) && isLess(y, z)) {
      expect(isLess(x, z)).toStrictEqual(true);
    } else {
      expect(isLess(x, z)).toStrictEqual(expect.anything());
    }
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
    if (isMore(x, y) && isMore(y, z)) {
      expect(isMore(x, z)).toStrictEqual(true);
    } else {
      expect(isMore(x, z)).toStrictEqual(expect.anything());
    }
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

  const unsafeCompareDefinition = (x: A, y: A): void => {
    try {
      expect(new Some(unsafeCompare(x, y))).toStrictEqual(compare(x, y));
    } catch (error) {
      expect(error).toBeInstanceOf(ComparabilityError);
    }
  };

  const maxDefinition = (x: A, y: A): void => {
    try {
      const expected = ordering.isNotLess(unsafeCompare(x, y)) ? x : y;
      expect(max(x, y)).toStrictEqual(expected);
    } catch (error) {
      expect(error).toBeInstanceOf(ComparabilityError);
    }
  };

  const minDefinition = (x: A, y: A): void => {
    try {
      const expected = ordering.isNotMore(unsafeCompare(x, y)) ? x : y;
      expect(min(x, y)).toStrictEqual(expected);
    } catch (error) {
      expect(error).toBeInstanceOf(ComparabilityError);
    }
  };

  const clampDefinition = (value: A, lower: A, upper: A): void => {
    try {
      expect(clamp(value, lower, upper)).toStrictEqual(
        min(max(value, lower), upper),
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ComparabilityError);
    }
  };

  describe(`Order<${name}>`, () => {
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

    describe("unsafeCompare", () => {
      it("should agree with compare", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, unsafeCompareDefinition));
      });
    });

    describe("max", () => {
      it("should agree with unsafeCompare", () => {
        expect.assertions(100);

        fc.assert(fc.property(value, value, maxDefinition));
      });
    });

    describe("min", () => {
      it("should agree with unsafeCompare", () => {
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

class UnknownOrder extends Order<unknown> {
  public override readonly isSame: (x: unknown, y: unknown) => boolean =
    Object.is;

  public override readonly isLess: (x: unknown, y: unknown) => boolean = () =>
    false;

  public override readonly isMore: (x: unknown, y: unknown) => boolean = () =>
    false;

  public static readonly instance = new UnknownOrder();
}

testOrder("unknown", fc.anything(), UnknownOrder.instance);
testOrder("string", fc.string(), StringOrder.instance);
testOrder("number", fc.double(), NumberOrder.instance);
testOrder("bigint", fc.bigUint(), BigIntOrder.instance);
testOrder("boolean", fc.boolean(), BooleanOrder.instance);
testOrder("Date", fc.date(), DateOrder.instance);
