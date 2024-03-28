import type { Option } from "./option.js";
import { None, Some } from "./option.js";
import { Pair } from "./pair.js";

export type Result<E, A> = Okay<A> | Fail<E>;

abstract class ResultTrait {
  public abstract readonly isOkay: boolean;

  public abstract readonly isFail: boolean;

  public toString<E, A>(this: Result<E, A>): string {
    return this.isOkay
      ? `Okay(${String(this.value)})`
      : `Fail(${String(this.value)})`;
  }

  public map<E, F, A, B>(
    this: Result<E, A>,
    okayMorphism: (value: A) => B,
    failMorphism: (value: E) => F,
  ): Result<F, B> {
    return this.isOkay
      ? new Okay(okayMorphism(this.value))
      : new Fail(failMorphism(this.value));
  }

  public mapOkay<E, A, B>(
    this: Result<E, A>,
    morphism: (value: A) => B,
  ): Result<E, B> {
    return this.isOkay ? new Okay(morphism(this.value)) : this;
  }

  public mapFail<E, F, A>(
    this: Result<E, A>,
    morphism: (value: E) => F,
  ): Result<F, A> {
    return this.isFail ? new Fail(morphism(this.value)) : this;
  }

  public replace<E, F, A, B>(
    this: Result<E, A>,
    okayValue: B,
    failValue: F,
  ): Result<F, B> {
    return this.isOkay ? new Okay(okayValue) : new Fail(failValue);
  }

  public replaceOkay<E, A, B>(this: Result<E, A>, value: B): Result<E, B> {
    return this.isOkay ? new Okay(value) : this;
  }

  public replaceFail<E, F, A>(this: Result<E, A>, value: F): Result<F, A> {
    return this.isFail ? new Fail(value) : this;
  }

  public and<E, A, B>(
    this: Result<E, A>,
    that: Result<E, B>,
  ): Result<E, Pair<A, B>> {
    if (this.isFail) return this;
    if (that.isFail) return that;
    return new Okay(new Pair(this.value, that.value));
  }

  public andThen<E, A, B>(
    this: Result<E, A>,
    that: Result<E, B>,
  ): Result<E, B> {
    return this.isOkay ? that : this;
  }

  public andWhen<E, A, B>(
    this: Result<E, A>,
    that: Result<E, B>,
  ): Result<E, A> {
    return this.isOkay && that.isFail ? that : this;
  }

  public or<E, F, A>(
    this: Result<E, A>,
    that: Result<F, A>,
  ): Result<Pair<E, F>, A> {
    if (this.isOkay) return this;
    if (that.isOkay) return that;
    return new Fail(new Pair(this.value, that.value));
  }

  public orElse<E, F, A>(this: Result<E, A>, that: Result<F, A>): Result<F, A> {
    return this.isOkay ? this : that;
  }

  public orErst<E, F, A>(this: Result<E, A>, that: Result<F, A>): Result<E, A> {
    return this.isOkay || that.isFail ? this : that;
  }

  public flatMap<E, F, A, B>(
    this: Result<E, A>,
    okayArrow: (value: A) => Result<F, B>,
    failArrow: (value: E) => Result<F, B>,
  ): Result<F, B> {
    return this.isOkay ? okayArrow(this.value) : failArrow(this.value);
  }

  public flatMapOkay<E, A, B>(
    this: Result<E, A>,
    arrow: (value: A) => Result<E, B>,
  ): Result<E, B> {
    return this.isOkay ? arrow(this.value) : this;
  }

  public flatMapFail<E, F, A>(
    this: Result<E, A>,
    arrow: (value: E) => Result<F, A>,
  ): Result<F, A> {
    return this.isFail ? arrow(this.value) : this;
  }

  public flatten<E, A>(this: Result<Result<E, A>, Result<E, A>>): Result<E, A> {
    return this.value;
  }

  public flattenOkay<E, A>(this: Result<E, Result<E, A>>): Result<E, A> {
    return this.isOkay ? this.value : this;
  }

  public flattenFail<E, A>(this: Result<Result<E, A>, A>): Result<E, A> {
    return this.isFail ? this.value : this;
  }

  public flatMapUntil<E, F, A, B>(
    this: Result<E, A>,
    okayArrow: (value: A) => Result<Result<E, F>, Result<A, B>>,
    failArrow: (value: E) => Result<Result<E, F>, Result<A, B>>,
  ): Result<F, B> {
    let result = this.flatMap(okayArrow, failArrow).distribute();
    while (result.isFail)
      result = result.value.flatMap(okayArrow, failArrow).distribute();
    return result.value;
  }

  public flatMapOkayUntil<E, A, B>(
    this: Result<E, A>,
    arrow: (value: A) => Result<E, Result<A, B>>,
  ): Result<E, B> {
    let result = this.flatMapOkay(arrow).exchangeFail();
    while (result.isFail) result = arrow(result.value).exchangeFail();
    return result.value;
  }

  public flatMapFailUntil<E, F, A>(
    this: Result<E, A>,
    arrow: (value: E) => Result<Result<E, F>, A>,
  ): Result<F, A> {
    let result = this.flatMapFail(arrow).associateRight();
    while (result.isFail) result = arrow(result.value).associateRight();
    return result.value;
  }

  public commute<A>(this: Okay<A>): Fail<A>;
  public commute<A>(this: Fail<A>): Okay<A>;
  public commute<A, B>(this: Result<A, B>): Result<B, B>;
  public commute<A, B>(this: Result<A, B>): Result<B, A> {
    return this.isOkay ? new Fail(this.value) : new Okay(this.value);
  }

  public isOkayAnd<E, A, B extends A>(
    this: Result<E, A>,
    predicate: (value: A) => value is B,
  ): this is Okay<B>;
  public isOkayAnd<E, A>(
    this: Result<E, A>,
    predicate: (value: A) => boolean,
  ): this is Okay<A>;
  public isOkayAnd<E, A>(
    this: Result<E, A>,
    predicate: (value: A) => boolean,
  ): this is Okay<A> {
    return this.isOkay && predicate(this.value);
  }

  public isFailAnd<E, F extends E, A>(
    this: Result<E, A>,
    predicate: (value: E) => value is F,
  ): this is Fail<F>;
  public isFailAnd<E, A>(
    this: Result<E, A>,
    predicate: (value: E) => boolean,
  ): this is Fail<E>;
  public isFailAnd<E, A>(
    this: Result<E, A>,
    predicate: (value: E) => boolean,
  ): this is Fail<E> {
    return this.isFail && predicate(this.value);
  }

  public isOkayOr<E, F extends E, A>(
    this: Result<E, A>,
    predicate: (value: E) => value is F,
  ): this is Result<F, A>;
  public isOkayOr<E, A>(
    this: Result<E, A>,
    predicate: (value: E) => boolean,
  ): boolean;
  public isOkayOr<E, A>(
    this: Result<E, A>,
    predicate: (value: E) => boolean,
  ): boolean {
    return this.isOkay || predicate(this.value);
  }

  public isFailOr<E, A, B extends A>(
    this: Result<E, A>,
    predicate: (value: A) => value is B,
  ): this is Result<E, B>;
  public isFailOr<E, A>(
    this: Result<E, A>,
    predicate: (value: A) => boolean,
  ): boolean;
  public isFailOr<E, A>(
    this: Result<E, A>,
    predicate: (value: A) => boolean,
  ): boolean {
    return this.isFail || predicate(this.value);
  }

  public transposeMap<E, F, A, B>(
    this: Result<E, A>,
    transposeOkay: (value: A) => Option<B>,
    transposeFail: (value: E) => Option<F>,
  ): Option<Result<F, B>> {
    return this.isOkay
      ? transposeOkay(this.value).map(Okay.of)
      : transposeFail(this.value).map(Fail.of);
  }

  public transposeMapOkay<E, A, B>(
    this: Result<E, A>,
    transpose: (value: A) => Option<B>,
  ): Option<Result<E, B>> {
    return this.isFail ? new Some(this) : transpose(this.value).map(Okay.of);
  }

  public transposeMapFail<E, F, A>(
    this: Result<E, A>,
    transpose: (value: E) => Option<F>,
  ): Option<Result<F, A>> {
    return this.isOkay ? new Some(this) : transpose(this.value).map(Fail.of);
  }

  public transpose<E, A>(
    this: Result<Option<E>, Option<A>>,
  ): Option<Result<E, A>> {
    return this.isOkay ? this.value.map(Okay.of) : this.value.map(Fail.of);
  }

  public transposeOkay<E, A>(this: Result<E, Option<A>>): Option<Result<E, A>> {
    return this.isFail ? new Some(this) : this.value.map(Okay.of);
  }

  public transposeFail<E, A>(this: Result<Option<E>, A>): Option<Result<E, A>> {
    return this.isOkay ? new Some(this) : this.value.map(Fail.of);
  }

  public unzipWith<E, F, G, A, B, C>(
    this: Result<E, A>,
    unzipOkay: (value: A) => Pair<B, C>,
    unzipFail: (value: E) => Pair<F, G>,
  ): Pair<Result<F, B>, Result<G, C>> {
    return this.isOkay
      ? unzipOkay(this.value).map(Okay.of, Okay.of)
      : unzipFail(this.value).map(Fail.of, Fail.of);
  }

  public unzipWithOkay<E, A, B, C>(
    this: Result<E, A>,
    unzip: (value: A) => Pair<B, C>,
  ): Pair<Result<E, B>, Result<E, C>> {
    return this.isFail
      ? Pair.of(this)
      : unzip(this.value).map(Okay.of, Okay.of);
  }

  public unzipWithFail<E, F, G, A>(
    this: Result<E, A>,
    unzip: (value: E) => Pair<F, G>,
  ): Pair<Result<F, A>, Result<G, A>> {
    return this.isOkay
      ? Pair.of(this)
      : unzip(this.value).map(Fail.of, Fail.of);
  }

  public unzip<E, F, A, B>(
    this: Result<Pair<E, F>, Pair<A, B>>,
  ): Pair<Result<E, A>, Result<F, B>> {
    return this.isOkay
      ? this.value.map(Okay.of, Okay.of)
      : this.value.map(Fail.of, Fail.of);
  }

  public unzipOkay<E, A, B>(
    this: Result<E, Pair<A, B>>,
  ): Pair<Result<E, A>, Result<E, B>> {
    return this.isFail ? Pair.of(this) : this.value.map(Okay.of, Okay.of);
  }

  public unzipFail<E, F, A>(
    this: Result<Pair<E, F>, A>,
  ): Pair<Result<E, A>, Result<F, A>> {
    return this.isOkay ? Pair.of(this) : this.value.map(Fail.of, Fail.of);
  }

  public collectMapFst<E, T, A, B, C>(
    this: Result<E, T>,
    okayMorphism: (value: T) => Pair<B, C>,
    failMorphism: (value: E) => Pair<A, C>,
  ): Pair<Result<A, B>, C> {
    return this.isOkay
      ? okayMorphism(this.value).mapFst(Okay.of)
      : failMorphism(this.value).mapFst(Fail.of);
  }

  public collectFst<A, B, C>(
    this: Result<Pair<A, C>, Pair<B, C>>,
  ): Pair<Result<A, B>, C> {
    return this.isOkay
      ? this.value.mapFst(Okay.of)
      : this.value.mapFst(Fail.of);
  }

  public collectMapSnd<E, T, A, B, C>(
    this: Result<E, T>,
    okayMorphism: (value: T) => Pair<A, C>,
    failMorphism: (value: E) => Pair<A, B>,
  ): Pair<A, Result<B, C>> {
    return this.isOkay
      ? okayMorphism(this.value).mapSnd(Okay.of)
      : failMorphism(this.value).mapSnd(Fail.of);
  }

  public collectSnd<A, B, C>(
    this: Result<Pair<A, B>, Pair<A, C>>,
  ): Pair<A, Result<B, C>> {
    return this.isOkay
      ? this.value.mapSnd(Okay.of)
      : this.value.mapSnd(Fail.of);
  }

  public collectMapOkay<E, F, A, B, C>(
    this: Result<E, A>,
    okayMorphism: (value: A) => Result<F, C>,
    failMorphism: (value: E) => Result<F, B>,
  ): Result<F, Result<B, C>> {
    return this.isOkay
      ? okayMorphism(this.value).mapOkay(Okay.of)
      : failMorphism(this.value).mapOkay(Fail.of);
  }

  public exchangeMapFail<E, F, A, B>(
    this: Result<E, A>,
    exchange: (value: A) => Result<F, B>,
  ): Result<F, Result<E, B>> {
    return this.isFail ? new Okay(this) : exchange(this.value).mapOkay(Okay.of);
  }

  public associateMapRight<T, A, B, C>(
    this: Result<T, C>,
    morphism: (value: T) => Result<A, B>,
  ): Result<A, Result<B, C>> {
    return this.isOkay ? new Okay(this) : morphism(this.value).mapOkay(Fail.of);
  }

  public collectOkay<E, A, B>(
    this: Result<Result<E, A>, Result<E, B>>,
  ): Result<E, Result<A, B>> {
    return this.isOkay
      ? this.value.mapOkay(Okay.of)
      : this.value.mapOkay(Fail.of);
  }

  public exchangeFail<E, F, A>(
    this: Result<E, Result<F, A>>,
  ): Result<F, Result<E, A>> {
    return this.isFail ? new Okay(this) : this.value.mapOkay(Okay.of);
  }

  public associateRight<A, B, C>(
    this: Result<Result<A, B>, C>,
  ): Result<A, Result<B, C>> {
    return this.isOkay ? new Okay(this) : this.value.mapOkay(Fail.of);
  }

  public collectMapFail<E, F, G, A, B>(
    this: Result<E, A>,
    okayMorphism: (value: A) => Result<G, B>,
    failMorphism: (value: E) => Result<F, B>,
  ): Result<Result<F, G>, B> {
    return this.isOkay
      ? okayMorphism(this.value).mapFail(Okay.of)
      : failMorphism(this.value).mapFail(Fail.of);
  }

  public exchangeMapOkay<E, F, A, B>(
    this: Result<E, A>,
    exchange: (value: E) => Result<F, B>,
  ): Result<Result<F, A>, B> {
    return this.isOkay ? new Fail(this) : exchange(this.value).mapFail(Fail.of);
  }

  public associateMapLeft<A, B, C, T>(
    this: Result<A, T>,
    morphism: (value: T) => Result<B, C>,
  ): Result<Result<A, B>, C> {
    return this.isFail ? new Fail(this) : morphism(this.value).mapFail(Okay.of);
  }

  public collectFail<E, F, A>(
    this: Result<Result<E, A>, Result<F, A>>,
  ): Result<Result<E, F>, A> {
    return this.isOkay
      ? this.value.mapFail(Okay.of)
      : this.value.mapFail(Fail.of);
  }

  public exchangeOkay<E, A, B>(
    this: Result<Result<E, A>, B>,
  ): Result<Result<E, B>, A> {
    return this.isOkay ? new Fail(this) : this.value.mapFail(Fail.of);
  }

  public associateLeft<A, B, C>(
    this: Result<A, Result<B, C>>,
  ): Result<Result<A, B>, C> {
    return this.isFail ? new Fail(this) : this.value.mapFail(Okay.of);
  }

  public distributeMap<E, F, G, A, B, C>(
    this: Result<E, A>,
    okayMorphism: (value: A) => Result<B, C>,
    failMorphism: (value: E) => Result<F, G>,
  ): Result<Result<F, B>, Result<G, C>> {
    return this.isOkay
      ? okayMorphism(this.value).map(Okay.of, Okay.of)
      : failMorphism(this.value).map(Fail.of, Fail.of);
  }

  public distribute<E, F, A, B>(
    this: Result<Result<E, F>, Result<A, B>>,
  ): Result<Result<E, A>, Result<F, B>> {
    return this.isOkay
      ? this.value.map(Okay.of, Okay.of)
      : this.value.map(Fail.of, Fail.of);
  }

  public extractOkay<E, A>(this: Result<E, A>, defaultValue: A): A {
    return this.isOkay ? this.value : defaultValue;
  }

  public extractFail<E, A>(this: Result<E, A>, defaultValue: E): E {
    return this.isFail ? this.value : defaultValue;
  }

  public extractMapOkay<E, A>(
    this: Result<E, A>,
    getOkayValue: (value: E) => A,
  ): A {
    return this.isOkay ? this.value : getOkayValue(this.value);
  }

  public extractMapFail<E, A>(
    this: Result<E, A>,
    getFailValue: (value: A) => E,
  ): E {
    return this.isFail ? this.value : getFailValue(this.value);
  }

  public toOptionOkay<E, A>(this: Result<E, A>): Option<A> {
    return this.isOkay ? new Some(this.value) : None.instance;
  }

  public toOptionFail<E, A>(this: Result<E, A>): Option<E> {
    return this.isFail ? new Some(this.value) : None.instance;
  }
}

export class Okay<out A> extends ResultTrait {
  public override readonly isOkay = true;

  public override readonly isFail = false;

  public constructor(public readonly value: A) {
    super();
  }

  public static of<A>(value: A): Okay<A> {
    return new Okay(value);
  }
}

export class Fail<out E> extends ResultTrait {
  public override readonly isOkay = false;

  public override readonly isFail = true;

  public constructor(public readonly value: E) {
    super();
  }

  public static of<E>(value: E): Fail<E> {
    return new Fail(value);
  }
}
