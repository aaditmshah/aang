import { UnsafeExtractError } from "./errors.js";
import { Exception } from "./exceptions.js";
import { Pair } from "./pair.js";
import type { Result } from "./result.js";
import { Fail, Okay } from "./result.js";

export type Option<A> = Some<A> | None;

abstract class OptionTrait {
  public abstract readonly isSome: boolean;

  public abstract readonly isNone: boolean;

  public map<A, B>(this: Option<A>, morphism: (value: A) => B): Option<B> {
    return this.isSome ? new Some(morphism(this.value)) : None.instance;
  }

  public replace<A, B>(this: Option<A>, value: B): Option<B> {
    return this.isSome ? new Some(value) : None.instance;
  }

  public and<A, B>(this: Option<A>, that: Option<B>): Option<Pair<A, B>> {
    return this.isSome && that.isSome
      ? new Some(new Pair(this.value, that.value))
      : None.instance;
  }

  public andThen<A, B>(this: Option<A>, that: Option<B>): Option<B> {
    return this.isSome && that.isSome ? that : None.instance;
  }

  public andWith<A, B>(this: Option<A>, that: Option<B>): Option<A> {
    return this.isSome && that.isSome ? this : None.instance;
  }

  public or<A>(this: Option<A>, that: Option<A>): Option<A> {
    return this.isSome ? this : that;
  }

  public flatMap<A, B>(
    this: Option<A>,
    arrow: (value: A) => Option<B>,
  ): Option<B> {
    return this.isSome ? arrow(this.value) : None.instance;
  }

  public flatten<A>(this: Option<Option<A>>): Option<A> {
    return this.isSome ? this.value : None.instance;
  }

  public filter<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): Option<A> {
    return this.isSome && predicate(this.value) ? this : None.instance;
  }

  public isSomeAnd<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): boolean {
    return this.isSome && predicate(this.value);
  }

  public isNoneOr<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): boolean {
    return this.isNone || predicate(this.value);
  }

  public unzipWith<A, B, C>(
    this: Option<A>,
    unzip: (value: A) => Pair<B, C>,
  ): Pair<Option<B>, Option<C>> {
    return this.isNone
      ? Pair.of(None.instance)
      : unzip(this.value).map(Some.of, Some.of);
  }

  public unzip<A, B>(this: Option<Pair<A, B>>): Pair<Option<A>, Option<B>> {
    return this.isNone
      ? Pair.of(None.instance)
      : this.value.map(Some.of, Some.of);
  }

  public transposeMap<A, E, B>(
    this: Option<A>,
    transpose: (value: A) => Result<E, B>,
  ): Result<E, Option<B>> {
    return this.isNone
      ? new Okay(None.instance)
      : transpose(this.value).mapOkay(Some.of);
  }

  public transpose<E, A>(this: Option<Result<E, A>>): Result<E, Option<A>> {
    return this.isNone ? new Okay(None.instance) : this.value.mapOkay(Some.of);
  }

  public safeExtract<A>(this: Option<A>, defaultValue: A): A {
    return this.isSome ? this.value : defaultValue;
  }

  public unsafeExtract<A>(this: Option<A>, error: Exception | string): A {
    if (this.isSome) return this.value;
    throw error instanceof Exception ? error : new UnsafeExtractError(error);
  }

  public toResult<E, A>(this: Option<A>, defaultValue: E): Result<E, A> {
    return this.isSome ? new Okay(this.value) : new Fail(defaultValue);
  }

  public *[Symbol.iterator]<A>(this: Option<A>): Generator<A, void, undefined> {
    if (this.isSome) yield this.value;
  }
}

export class Some<out A> extends OptionTrait {
  public override readonly isSome = true;

  public override readonly isNone = false;

  public constructor(public readonly value: A) {
    super();
  }

  public static of<A>(value: A): Some<A> {
    return new Some(value);
  }
}

export class None extends OptionTrait {
  public override readonly isSome = false;

  public override readonly isNone = true;

  public static readonly instance = new None();
}
