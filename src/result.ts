import type { Option } from "./option.js";
import { None, Some } from "./option.js";

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
