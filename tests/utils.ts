import type { Result } from "../src/result.js";
import { Fail, Okay } from "../src/result.js";

export const isPowerOfTwo = (n: number): boolean =>
  (Math.log(n) / Math.log(2)) % 1 === 0;

export const hotpo = (n: number): number => (n % 2 === 0 ? n / 2 : 3 * n + 1);

export const collatz = (n: number): Result<number, number> =>
  isPowerOfTwo(n) ? new Okay(n) : new Fail(hotpo(n));
