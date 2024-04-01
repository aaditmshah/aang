import type { Option } from "./option.js";
import { Some } from "./option.js";

export class Pair<out A, out B> {
  public constructor(
    public readonly fst: A,
    public readonly snd: B,
  ) {}

  public static of<A, B>(fst: A, snd: B): Pair<A, B> {
    return new Pair(fst, snd);
  }

  public static from<A>(value: A): Pair<A, A> {
    return new Pair(value, value);
  }

  public toString<A, B>(this: Pair<A, B>): string {
    return `Pair(${String(this.fst)}, ${String(this.snd)})`;
  }

  public fold<A, B, C>(this: Pair<A, B>, morphism: (a: A, b: B) => C): C {
    return morphism(this.fst, this.snd);
  }

  public map<A, B, C, D>(
    this: Pair<A, B>,
    fstMorphism: (fst: A) => C,
    sndMorphism: (snd: B) => D,
  ): Pair<C, D> {
    return new Pair(fstMorphism(this.fst), sndMorphism(this.snd));
  }

  public mapFst<A, B, C>(
    this: Pair<A, C>,
    morphism: (fst: A) => B,
  ): Pair<B, C> {
    return new Pair(morphism(this.fst), this.snd);
  }

  public mapSnd<A, B, C>(
    this: Pair<A, B>,
    morphism: (snd: B) => C,
  ): Pair<A, C> {
    return new Pair(this.fst, morphism(this.snd));
  }

  public replaceFst<A, B, C>(this: Pair<A, C>, fst: B): Pair<B, C> {
    return new Pair(fst, this.snd);
  }

  public replaceSnd<A, B, C>(this: Pair<A, B>, snd: C): Pair<A, C> {
    return new Pair(this.fst, snd);
  }

  public and<A, B, C, D>(
    this: Pair<A, B>,
    that: Pair<C, D>,
  ): Pair<Pair<A, C>, Pair<B, D>> {
    return new Pair(new Pair(this.fst, that.fst), new Pair(this.snd, that.snd));
  }

  public commute<A, B>(this: Pair<A, B>): Pair<B, A> {
    return new Pair(this.snd, this.fst);
  }

  public andMapOption<X, Y, A, B>(
    this: Pair<X, Y>,
    fstMorphism: (value: X) => Option<A>,
    sndMorphism: (value: Y) => Option<B>,
  ): Option<Pair<A, B>> {
    return fstMorphism(this.fst).and(sndMorphism(this.snd));
  }

  public andMapFstOption<X, A, B>(
    this: Pair<X, B>,
    morphism: (value: X) => Option<A>,
  ): Option<Pair<A, B>> {
    return morphism(this.fst).and(new Some(this.snd));
  }

  public andMapSndOption<Y, A, B>(
    this: Pair<A, Y>,
    morphism: (value: Y) => Option<B>,
  ): Option<Pair<A, B>> {
    return new Some(this.fst).and(morphism(this.snd));
  }

  public andOption<A, B>(this: Pair<Option<A>, Option<B>>): Option<Pair<A, B>> {
    return this.fst.and(this.snd);
  }

  public andFstOption<A, B>(this: Pair<Option<A>, B>): Option<Pair<A, B>> {
    return this.fst.and(new Some(this.snd));
  }

  public andSndOption<A, B>(this: Pair<A, Option<B>>): Option<Pair<A, B>> {
    return new Some(this.fst).and(this.snd);
  }

  public associateLeft<A, B, C>(
    this: Pair<A, Pair<B, C>>,
  ): Pair<Pair<A, B>, C> {
    return new Pair(new Pair(this.fst, this.snd.fst), this.snd.snd);
  }

  public associateRight<A, B, C>(
    this: Pair<Pair<A, B>, C>,
  ): Pair<A, Pair<B, C>> {
    return new Pair(this.fst.fst, new Pair(this.fst.snd, this.snd));
  }

  public values<A, B>(this: Pair<A, B>): [A, B] {
    return [this.fst, this.snd];
  }
}
