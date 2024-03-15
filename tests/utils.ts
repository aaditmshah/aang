export const isPowerOfTwo = (n: number): boolean =>
  (Math.log(n) / Math.log(2)) % 1 === 0;

export const hotpo = (n: number): number => (n % 2 === 0 ? n / 2 : 3 * n + 1);
