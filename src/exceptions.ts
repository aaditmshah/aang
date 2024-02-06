import { defineValue } from "./expression.js";

export interface ErrorOptions {
  cause?: unknown;
}

export abstract class Exception extends Error {
  public constructor(message?: string, options?: ErrorOptions) {
    super(message, options);

    this.setName(new.target.name);

    Object.setPrototypeOf(this, new.target.prototype);

    if ("captureStackTrace" in Error) {
      Error.captureStackTrace(this, new.target);
    }
  }

  protected setName(name: string): void {
    defineValue(this, "name", name, { enumerable: false });
  }
}
