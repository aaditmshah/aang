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

  public and<E, F, A, B>(
    this: Result<E, A>,
    that: Result<F, B>,
  ): Result<E | F, Pair<A, B>> {
    if (this.isFail) return this;
    if (that.isFail) return that;
    return new Okay(new Pair(this.value, that.value));
  }

  public andThen<E, F, A, B>(
    this: Result<E, A>,
    that: Result<F, B>,
  ): Result<E | F, B> {
    return this.isOkay ? that : this;
  }

  public andWhen<E, F, A, B>(
    this: Result<E, A>,
    that: Result<F, B>,
  ): Result<E | F, A> {
    return this.isOkay && that.isFail ? that : this;
  }

  public or<E, F, A, B>(
    this: Result<E, A>,
    that: Result<F, B>,
  ): Result<Pair<E, F>, A | B> {
    if (this.isOkay) return this;
    if (that.isOkay) return that;
    return new Fail(new Pair(this.value, that.value));
  }

  public orElse<E, F, A, B>(
    this: Result<E, A>,
    that: Result<F, B>,
  ): Result<F, A | B> {
    return this.isOkay ? this : that;
  }

  public orErst<E, F, A, B>(
    this: Result<E, A>,
    that: Result<F, B>,
  ): Result<E, A | B> {
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
