import { describe, expect, it } from "@jest/globals";
import fc from "fast-check";

import { Exception } from "../src/exceptions.js";

class MyCustomException extends Exception {
  public constructor(message: string) {
    super(message);
    this.setName("MyCustomException");
  }
}

const exceptionName = (message: string): void => {
  expect(new MyCustomException(message).name).toStrictEqual(
    "MyCustomException",
  );
};

const exceptionMessage = (message: string): void => {
  expect(new MyCustomException(message).message).toStrictEqual(message);
};

const exceptionError = (message: string): void => {
  expect(new MyCustomException(message)).toBeInstanceOf(Error);
};

const exceptionStack = (message: string): void => {
  expect(new MyCustomException(message).stack).toBeDefined();
};

describe("Exception", () => {
  it("should have the specified name", () => {
    expect.assertions(100);

    fc.assert(fc.property(fc.string(), exceptionName));
  });

  it("should have the given message", () => {
    expect.assertions(100);

    fc.assert(fc.property(fc.string(), exceptionMessage));
  });

  it("should be an instance of Error", () => {
    expect.assertions(100);

    fc.assert(fc.property(fc.string(), exceptionError));
  });

  it("should have a stack trace", () => {
    expect.assertions(100);

    fc.assert(fc.property(fc.string(), exceptionStack));
  });
});
