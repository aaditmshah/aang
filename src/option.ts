import { UnsafeExtractError } from "./errors.js";
import { Exception } from "./exceptions.js";
import type { PartialOrder, Setoid, TotalOrder } from "./order.js";
import type { Ordering } from "./ordering.js";
import { Pair } from "./pair.js";
import type { Result } from "./result.js";
import { Fail, Okay } from "./result.js";

export type Option<A> = Some<A> | None;

abstract class OptionTrait implements TotalOrder<Option<never>> {
  public abstract readonly isSome: boolean;

  public abstract readonly isNone: boolean;

  public toString<A>(this: Option<A>): string {
    return this.isSome ? `Some(${String(this.value)})` : "None";
  }

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

  public filter<A, B extends A>(
    this: Option<A>,
    predicate: (value: A) => value is B,
  ): Option<B>;
  public filter<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): Option<A>;
  public filter<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): Option<A> {
    return this.isSome && predicate(this.value) ? this : None.instance;
  }

  public isSomeAnd<A, B extends A>(
    this: Option<A>,
    predicate: (value: A) => value is B,
  ): this is Option<B>;
  public isSomeAnd<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): boolean;
  public isSomeAnd<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): boolean {
    return this.isSome && predicate(this.value);
  }

  public isNoneOr<A, B extends A>(
    this: Option<A>,
    predicate: (value: A) => value is B,
  ): this is Option<B>;
  public isNoneOr<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): boolean;
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

  public isSame<A extends Setoid<A>>(
    this: Option<A>,
    that: Option<A>,
  ): boolean {
    return this.isSome
      ? that.isSome && this.value.isSame(that.value)
      : that.isNone;
  }

  public isNotSame<A extends Setoid<A>>(
    this: Option<A>,
    that: Option<A>,
  ): boolean {
    return this.isSome
      ? that.isNone || this.value.isNotSame(that.value)
      : that.isSome;
  }

  public isLess<A extends PartialOrder<A>>(
    this: Option<A>,
    that: Option<A>,
  ): boolean {
    return that.isSome && (this.isNone || this.value.isLess(that.value));
  }

  public isNotLess<A extends PartialOrder<A>>(
    this: Option<A>,
    that: Option<A>,
  ): boolean {
    return that.isNone || (this.isSome && this.value.isNotLess(that.value));
  }

  public isMore<A extends PartialOrder<A>>(
    this: Option<A>,
    that: Option<A>,
  ): boolean {
    return this.isSome && (that.isNone || this.value.isMore(that.value));
  }

  public isNotMore<A extends PartialOrder<A>>(
    this: Option<A>,
    that: Option<A>,
  ): boolean {
    return this.isNone || (that.isSome && this.value.isNotMore(that.value));
  }

  public compare<A extends PartialOrder<A>>(
    this: Option<A>,
    that: Option<A>,
  ): Option<Ordering> {
    if (this.isNone) return new Some(that.isSome ? "<" : "=");
    if (that.isNone) return new Some(">");
    return this.value.compare(that.value);
  }

  public max<A extends TotalOrder<A>>(
    this: Option<A>,
    that: Option<A>,
  ): Option<A> {
    if (this.isNone) return that;
    if (that.isNone) return this;
    return new Some(this.value.max(that.value));
  }

  public min<A extends TotalOrder<A>>(
    this: Option<A>,
    that: Option<A>,
  ): Option<A> {
    if (this.isNone || that.isNone) return None.instance;
    return new Some(this.value.min(that.value));
  }

  public clamp<A extends TotalOrder<A>>(
    this: Option<A>,
    lower: Option<A>,
    upper: Option<A>,
  ): Option<A> {
    return this.max(lower).min(upper);
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

export const fromNullable = <A>(value: A): Option<NonNullable<A>> =>
  value == null ? None.instance : new Some(value);

export const fromFalsy = <A>(value: A): Option<NonNullable<A>> =>
  value ? new Some(value) : None.instance;

export function fromValue<A, B extends A>(
  value: A,
  predicate: (value: A) => value is B,
): Option<B>;
export function fromValue<A>(
  value: A,
  predicate: (value: A) => boolean,
): Option<A>;
export function fromValue<A>(
  value: A,
  predicate: (value: A) => boolean,
): Option<A> {
  return predicate(value) ? new Some(value) : None.instance;
}
