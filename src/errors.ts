export interface ErrorOptions {
  cause?: unknown;
}

export abstract class CustomError extends Error {
  public constructor(name: string, message?: string, options?: ErrorOptions) {
    super(message, options);

    Object.defineProperty(this, "name", {
      value: name,
      enumerable: false,
      configurable: true,
    });

    Object.setPrototypeOf(this, new.target.prototype);

    if ("captureStackTrace" in Error) {
      Error.captureStackTrace(this, new.target);
    }
  }
}
