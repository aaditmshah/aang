import type { Result } from "../src/result.js";
import { Fail, Okay } from "../src/result.js";
import type { Task } from "../src/task.js";

export const isPowerOfTwo = (n: number): boolean =>
  (Math.log(n) / Math.log(2)) % 1 === 0;

export const hotpo = (n: number): number => (n % 2 === 0 ? n / 2 : 3 * n + 1);

export const collatz = (n: number): Result<number, number> =>
  isPowerOfTwo(n) ? new Okay(n) : new Fail(hotpo(n));

export const spawn = <A, E>(task: Task<A, E>): Promise<Result<A, E>> =>
  new Promise((resolve) => {
    task.run(resolve);
  });
