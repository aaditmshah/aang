import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { Exception } from "./exceptions.js";

class MyCustomException extends Exception {
	public constructor(message: string) {
		super(message);
		this.setName("MyCustomException");
	}
}

describe("Exception", () => {
	it("should have the specified name", () => {
		expect.assertions(100);

		fc.assert(
			fc.property(fc.string(), (message) => {
				expect(new MyCustomException(message).name).toStrictEqual("MyCustomException");
			}),
		);
	});

	it("should have the given message", () => {
		expect.assertions(100);

		fc.assert(
			fc.property(fc.string(), (message) => {
				expect(new MyCustomException(message).message).toStrictEqual(message);
			}),
		);
	});

	it("should be an instance of Error", () => {
		expect.assertions(100);

		fc.assert(
			fc.property(fc.string(), (message) => {
				expect(new MyCustomException(message)).toBeInstanceOf(Error);
			}),
		);
	});

	it("should have a stack trace", () => {
		expect.assertions(100);

		fc.assert(
			fc.property(fc.string(), (message) => {
				expect(new MyCustomException(message).stack).toBeDefined();
			}),
		);
	});
});
