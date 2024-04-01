import type { Option } from "./option.js";
import { Some } from "./option.js";
import type { Result } from "./result.js";
import { Fail, Okay } from "./result.js";

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

  public andFst<A, B, C>(this: Pair<A, C>, snd: B): Pair<Pair<A, B>, C> {
    return new Pair(new Pair(this.fst, snd), this.snd);
  }

  public andSnd<A, B, C>(this: Pair<A, B>, snd: C): Pair<A, Pair<B, C>> {
    return new Pair(this.fst, new Pair(this.snd, snd));
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

  public andMapResult<X, Y, A, B, E>(
    this: Pair<X, Y>,
    fstMorphism: (value: X) => Result<A, E>,
    sndMorphism: (value: Y) => Result<B, E>,
  ): Result<Pair<A, B>, E> {
    return fstMorphism(this.fst).and(sndMorphism(this.snd));
  }

  public andMapFstResult<X, A, B, E>(
    this: Pair<X, B>,
    morphism: (value: X) => Result<A, E>,
  ): Result<Pair<A, B>, E> {
    return morphism(this.fst).and(new Okay(this.snd));
  }

  public andMapSndResult<Y, A, B, E>(
    this: Pair<A, Y>,
    morphism: (value: Y) => Result<B, E>,
  ): Result<Pair<A, B>, E> {
    return new Okay(this.fst).and(morphism(this.snd));
  }

  public andResult<A, B, E>(
    this: Pair<Result<A, E>, Result<B, E>>,
  ): Result<Pair<A, B>, E> {
    return this.fst.and(this.snd);
  }

  public andFstResult<A, B, E>(
    this: Pair<Result<A, E>, B>,
  ): Result<Pair<A, B>, E> {
    return this.fst.and(new Okay(this.snd));
  }

  public andSndResult<A, B, E>(
    this: Pair<A, Result<B, E>>,
  ): Result<Pair<A, B>, E> {
    return new Okay(this.fst).and(this.snd);
  }

  public orMapResult<X, Y, A, E, F>(
    this: Pair<X, Y>,
    fstMorphism: (value: X) => Result<A, E>,
    sndMorphism: (value: Y) => Result<A, F>,
  ): Result<A, Pair<E, F>> {
    return fstMorphism(this.fst).or(sndMorphism(this.snd));
  }

  public orMapFstResult<X, A, E, F>(
    this: Pair<X, F>,
    morphism: (value: X) => Result<A, E>,
  ): Result<A, Pair<E, F>> {
    return morphism(this.fst).or(new Fail(this.snd));
  }

  public orMapSndResult<Y, A, E, F>(
    this: Pair<E, Y>,
    morphism: (value: Y) => Result<A, F>,
  ): Result<A, Pair<E, F>> {
    return new Fail(this.fst).or(morphism(this.snd));
  }

  public orResult<A, E, F>(
    this: Pair<Result<A, E>, Result<A, F>>,
  ): Result<A, Pair<E, F>> {
    return this.fst.or(this.snd);
  }

  public orFstResult<A, E, F>(
    this: Pair<Result<A, E>, F>,
  ): Result<A, Pair<E, F>> {
    return this.fst.or(new Fail(this.snd));
  }

  public orSndResult<A, E, F>(
    this: Pair<E, Result<A, F>>,
  ): Result<A, Pair<E, F>> {
    return new Fail(this.fst).or(this.snd);
  }

  public distributeMap<X, Y, A, B, C, D>(
    this: Pair<X, Y>,
    fstMorphism: (value: X) => Pair<A, B>,
    sndMorphism: (value: Y) => Pair<C, D>,
  ): Pair<Pair<A, C>, Pair<B, D>> {
    const fst = fstMorphism(this.fst);
    const snd = sndMorphism(this.snd);
    return new Pair(new Pair(fst.fst, snd.fst), new Pair(fst.snd, snd.snd));
  }

  public distributeMapFst<X, A, B, C>(
    this: Pair<X, C>,
    morphism: (value: X) => Pair<A, B>,
  ): Pair<Pair<A, C>, Pair<B, C>> {
    const fst = morphism(this.fst);
    return new Pair(new Pair(fst.fst, this.snd), new Pair(fst.snd, this.snd));
  }

  public distributeMapSnd<Y, A, B, C>(
    this: Pair<A, Y>,
    morphism: (value: Y) => Pair<B, C>,
  ): Pair<Pair<A, B>, Pair<A, C>> {
    const snd = morphism(this.snd);
    return new Pair(new Pair(this.fst, snd.fst), new Pair(this.fst, snd.snd));
  }

  public distribute<A, B, C, D>(
    this: Pair<Pair<A, B>, Pair<C, D>>,
  ): Pair<Pair<A, C>, Pair<B, D>> {
    return new Pair(
      new Pair(this.fst.fst, this.snd.fst),
      new Pair(this.fst.snd, this.snd.snd),
    );
  }

  public distributeFst<A, B, C>(
    this: Pair<Pair<A, B>, C>,
  ): Pair<Pair<A, C>, Pair<B, C>> {
    return new Pair(
      new Pair(this.fst.fst, this.snd),
      new Pair(this.fst.snd, this.snd),
    );
  }

  public distributeSnd<A, B, C>(
    this: Pair<A, Pair<B, C>>,
  ): Pair<Pair<A, B>, Pair<A, C>> {
    return new Pair(
      new Pair(this.fst, this.snd.fst),
      new Pair(this.fst, this.snd.snd),
    );
  }

  public exchangeMapSnd<X, A, B, C>(
    this: Pair<X, C>,
    morphism: (value: X) => Pair<A, B>,
  ): Pair<Pair<A, C>, B> {
    const fst = morphism(this.fst);
    return new Pair(new Pair(fst.fst, this.snd), fst.snd);
  }

  public associateMapLeft<Y, A, B, C>(
    this: Pair<A, Y>,
    morphism: (value: Y) => Pair<B, C>,
  ): Pair<Pair<A, B>, C> {
    const snd = morphism(this.snd);
    return new Pair(new Pair(this.fst, snd.fst), snd.snd);
  }

  public exchangeSnd<A, B, C>(this: Pair<Pair<A, B>, C>): Pair<Pair<A, C>, B> {
    return new Pair(new Pair(this.fst.fst, this.snd), this.fst.snd);
  }

  public associateLeft<A, B, C>(
    this: Pair<A, Pair<B, C>>,
  ): Pair<Pair<A, B>, C> {
    return new Pair(new Pair(this.fst, this.snd.fst), this.snd.snd);
  }

  public exchangeMapFst<Y, A, B, C>(
    this: Pair<A, Y>,
    morphism: (value: Y) => Pair<B, C>,
  ): Pair<B, Pair<A, C>> {
    const snd = morphism(this.snd);
    return new Pair(snd.fst, new Pair(this.fst, snd.snd));
  }

  public associateMapRight<X, A, B, C>(
    this: Pair<X, C>,
    morphism: (value: X) => Pair<A, B>,
  ): Pair<A, Pair<B, C>> {
    const fst = morphism(this.fst);
    return new Pair(fst.fst, new Pair(fst.snd, this.snd));
  }

  public exchangeFst<A, B, C>(this: Pair<A, Pair<B, C>>): Pair<B, Pair<A, C>> {
    return new Pair(this.snd.fst, new Pair(this.fst, this.snd.snd));
  }

  public associateRight<A, B, C>(
    this: Pair<Pair<A, B>, C>,
  ): Pair<A, Pair<B, C>> {
    return new Pair(this.fst.fst, new Pair(this.fst.snd, this.snd));
  }

  public distributeMapOkay<Y, A, B, C>(
    this: Pair<A, Y>,
    morphism: (value: Y) => Result<B, C>,
  ): Result<Pair<A, B>, Pair<A, C>> {
    return morphism(this.snd).map(
      (snd) => new Pair(this.fst, snd),
      (snd) => new Pair(this.fst, snd),
    );
  }

  public distributeOkay<A, B, C>(
    this: Pair<A, Result<B, C>>,
  ): Result<Pair<A, B>, Pair<A, C>> {
    return this.snd.map(
      (snd) => new Pair(this.fst, snd),
      (snd) => new Pair(this.fst, snd),
    );
  }

  public distributeMapFail<X, A, B, C>(
    this: Pair<X, C>,
    morphism: (value: X) => Result<A, B>,
  ): Result<Pair<A, C>, Pair<B, C>> {
    return morphism(this.fst).map(
      (fst) => new Pair(fst, this.snd),
      (fst) => new Pair(fst, this.snd),
    );
  }

  public distributeFail<A, B, C>(
    this: Pair<Result<A, B>, C>,
  ): Result<Pair<A, C>, Pair<B, C>> {
    return this.fst.map(
      (fst) => new Pair(fst, this.snd),
      (fst) => new Pair(fst, this.snd),
    );
  }

  public values<A, B>(this: Pair<A, B>): [A, B] {
    return [this.fst, this.snd];
  }
}
