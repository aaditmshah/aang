import type { Pair } from "./pair.js";

export const id = <A>(value: A): A => value;

export const uncurry2 =
  <A, B, C>(morphism: (a: A, b: B) => C) =>
  ({ fst: a, snd: b }: Pair<A, B>): C =>
    morphism(a, b);

export const uncurry3 =
  <A, B, C, D>(morphism: (a: A, b: B, c: C) => D) =>
  ({ fst: { fst: a, snd: b }, snd: c }: Pair<Pair<A, B>, C>): D =>
    morphism(a, b, c);

export const uncurry4 =
  // oxfmt-ignore
  <A, B, C, D, E>(morphism: (a: A, b: B, c: C, d: D) => E) => ({
    fst: { fst: { fst: a, snd: b }, snd: c }, snd: d
  }: Pair<Pair<Pair<A, B>, C>, D>): E =>
    morphism(a, b, c, d);
