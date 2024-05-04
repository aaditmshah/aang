import type { PartialOrder, Setoid, TotalOrder } from "./order.js";
import type { Ordering } from "./ordering.js";
import { Pair } from "./pair.js";
import type { Result } from "./result.js";
import { Fail, Okay } from "./result.js";
import type { Semigroup } from "./semigroup.js";
import { Task } from "./task.js";

export type Option<A> = Some<A> | None;

abstract class OptionTrait {
  public abstract readonly isSome: boolean;

  public abstract readonly isNone: boolean;

  public toString<A>(this: Option<A>): string {
    return this.isSome ? `Some(${String(this.value)})` : "None";
  }

  public fold<A, B>(
    this: Option<A>,
    morphism: (value: A) => B,
    defaultValue: B,
  ): B {
    return this.isSome ? morphism(this.value) : defaultValue;
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
    return this.isSome ? that : None.instance;
  }

  public andWhen<A, B>(this: Option<A>, that: Option<B>): Option<A> {
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

  public flatMapUntil<A, B>(
    this: Option<A>,
    arrow: (value: A) => Option<Result<B, A>>,
  ): Option<B> {
    let result = this.flatMap(arrow).transposeOkay();
    while (result.isFail) result = arrow(result.value).transposeOkay();
    return result.value;
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
  ): this is Some<B>;
  public isSomeAnd<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): this is Some<A>;
  public isSomeAnd<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): this is Some<A> {
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
      ? Pair.from(None.instance)
      : unzip(this.value).map(Some.of, Some.of);
  }

  public unzip<A, B>(this: Option<Pair<A, B>>): Pair<Option<A>, Option<B>> {
    return this.isNone
      ? Pair.from(None.instance)
      : this.value.map(Some.of, Some.of);
  }

  public transposeMapOkay<A, B, E>(
    this: Option<A>,
    transpose: (value: A) => Result<B, E>,
  ): Result<Option<B>, E> {
    return this.isNone
      ? new Okay(None.instance)
      : transpose(this.value).mapOkay(Some.of);
  }

  public transposeMapFail<A, E, F>(
    this: Option<E>,
    transpose: (value: E) => Result<A, F>,
  ): Result<A, Option<F>> {
    return this.isNone
      ? new Fail(None.instance)
      : transpose(this.value).mapFail(Some.of);
  }

  public transposeOkay<A, E>(this: Option<Result<A, E>>): Result<Option<A>, E> {
    return this.isNone ? new Okay(None.instance) : this.value.mapOkay(Some.of);
  }

  public transposeFail<A, E>(this: Option<Result<A, E>>): Result<A, Option<E>> {
    return this.isNone ? new Fail(None.instance) : this.value.mapFail(Some.of);
  }

  public exchangeMapOkay<A, B, E>(
    this: Option<A>,
    exchange: (value: A) => Task<B, E>,
  ): Task<Option<B>, E> {
    return this.isNone
      ? Task.okay(None.instance)
      : exchange(this.value).mapOkay(Some.of);
  }

  public exchangeMapFail<A, E, F>(
    this: Option<E>,
    exchange: (value: E) => Task<A, F>,
  ): Task<A, Option<F>> {
    return this.isNone
      ? Task.fail(None.instance)
      : exchange(this.value).mapFail(Some.of);
  }

  public exchangeOkay<A, E>(this: Option<Task<A, E>>): Task<Option<A>, E> {
    return this.isNone ? Task.okay(None.instance) : this.value.mapOkay(Some.of);
  }

  public exchangeFail<A, E>(this: Option<Task<A, E>>): Task<A, Option<E>> {
    return this.isNone ? Task.fail(None.instance) : this.value.mapFail(Some.of);
  }

  public extractSome<A>(this: Option<A>, defaultValue: A): A {
    return this.isSome ? this.value : defaultValue;
  }

  public extractMapSome<A>(this: Option<A>, getDefaultValue: () => A): A {
    return this.isSome ? this.value : getDefaultValue();
  }

  public toResultOkay<A, E>(this: Option<A>, defaultValue: E): Result<A, E> {
    return this.isSome ? new Okay(this.value) : new Fail(defaultValue);
  }

  public toResultFail<A, E>(this: Option<E>, defaultValue: A): Result<A, E> {
    return this.isSome ? new Fail(this.value) : new Okay(defaultValue);
  }

  public append<A extends Semigroup<A>>(
    this: Option<A>,
    that: Option<A>,
  ): Option<A> {
    if (this.isNone) return that;
    if (that.isNone) return this;
    return new Some(this.value.append(that.value));
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

  public *values<A>(this: Option<A>): Generator<A, void, undefined> {
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

  public static fromValid<A, B extends A>(
    value: A,
    validate: (value: A) => value is B,
  ): Option<B>;
  public static fromValid<A>(
    value: A,
    validate: (value: A) => boolean,
  ): Option<A>;
  public static fromValid<A>(
    value: A,
    validate: (value: A) => boolean,
  ): Option<A> {
    return validate(value) ? new Some(value) : None.instance;
  }
}

export class None extends OptionTrait {
  public override readonly isSome = false;

  public override readonly isNone = true;

  public static readonly instance = new None();

  public static fromNullish<A>(value: A): Option<NonNullable<A>> {
    return value == null ? None.instance : new Some(value);
  }

  public static fromFalsy<A>(value: A): Option<NonNullable<A>> {
    return value ? new Some(value) : None.instance;
  }
}
