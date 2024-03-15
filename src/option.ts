import { NoneException } from "./exceptions.js";
import type { PartialOrder, Setoid, TotalOrder } from "./order.js";
import type { Ordering } from "./ordering.js";
import { Pair } from "./pair.js";
import type { Result } from "./result.js";
import { Fail, Okay } from "./result.js";
import type { Semigroup } from "./semigroup.js";

export type Option<A> = Some<A> | None;

abstract class OptionTrait
  implements Semigroup<Option<never>>, TotalOrder<Option<never>>
{
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
    return this.isSome ? that : None.instance;
  }

  public andWhen<A, B>(this: Option<A>, that: Option<B>): Option<A> {
    return this.isSome && that.isSome ? this : None.instance;
  }

  public or<A, B>(this: Option<A>, that: Option<B>): Option<A | B> {
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
    arrow: (value: A) => Option<Result<A, B>>,
  ): Option<B> {
    let result = this.flatMap(arrow).transpose();
    while (result.isFail) result = arrow(result.value).transpose();
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

  public extractSome<A>(this: Option<A>, defaultValue: A): A {
    return this.isSome ? this.value : defaultValue;
  }

  public mapExtractSome<A>(this: Option<A>, getDefaultValue: () => A): A {
    return this.isSome ? this.value : getDefaultValue();
  }

  public toResult<E, A>(this: Option<A>, defaultValue: E): Result<E, A> {
    return this.isSome ? new Okay(this.value) : new Fail(defaultValue);
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

  public *[Symbol.iterator]<A>(this: Option<A>): Generator<A, void, undefined> {
    if (this.isSome) yield this.value;
  }

  public *effectMap<A, B>(
    this: Option<A>,
    morphism: (value: A) => B,
  ): Generator<Option<A>, B, A> {
    const value = yield this;
    return morphism(value);
  }

  public *effect<A>(this: Option<A>): Generator<Option<A>, A, A> {
    const value = yield this;
    return value;
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

  // TODO: <A, B>(getGenerator: () => Generator<Option<A>, B, A>) => Option<B>
  public static fromGenerator<A>(
    getGenerator: () => Generator<Option<unknown>, A, unknown>,
  ): Option<A> {
    const generator = getGenerator();

    let result: IteratorResult<Option<unknown>, A>;

    try {
      result = generator.next();
    } catch (error) {
      if (error instanceof NoneException) return None.instance;
      throw error;
    }

    while (!result.done) {
      const option = result.value;
      try {
        result = option.isSome
          ? generator.next(option.value)
          : generator.throw(new NoneException());
      } catch (error) {
        if (error instanceof NoneException) return None.instance;
        throw error;
      }
    }

    return new Some(result.value);
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
