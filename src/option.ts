import { UnsafeExtractError } from "./errors.js";
import { Exception } from "./exceptions.js";
import type { Expression } from "./expression.js";
import { define, evaluate, fromValue } from "./expression.js";
import type { Result } from "./result.js";
import { Failure, Success } from "./result.js";

export type Option<A> = Some<A> | None;

abstract class OptionTrait {
  public abstract readonly isSome: boolean;

  public abstract readonly isNone: boolean;

  public map<A, B>(this: Option<A>, morphism: (value: A) => B): Option<B> {
    return this.isSome ? Some.of(morphism(this.value)) : None.instance;
  }

  public flatMap<A, B>(
    this: Option<A>,
    arrow: (value: A) => Option<B>,
  ): Option<B> {
    return this.isSome ? arrow(this.value) : None.instance;
  }

  public filter<A>(
    this: Option<A>,
    predicate: (value: A) => boolean,
  ): Option<A> {
    return this.isSome && predicate(this.value) ? this : None.instance;
  }

  public safeExtract<A>(this: Option<A>, defaultValue: Expression<A>): A {
    return this.isSome ? this.value : evaluate(defaultValue);
  }

  public unsafeExtract<A>(
    this: Option<A>,
    exception: Expression<Exception | string>,
  ): A {
    if (this.isSome) return this.value;
    const error = evaluate(exception);
    throw error instanceof Exception ? error : new UnsafeExtractError(error);
  }

  public toResult<E, A>(this: Option<A>, error: Expression<E>): Result<E, A> {
    return this.isSome ? Success.of(this.value) : new Failure(error);
  }

  public *[Symbol.iterator]<A>(this: Option<A>): Generator<A, void, undefined> {
    if (this.isSome) yield this.value;
  }
}

export class Some<out A> extends OptionTrait {
  public override readonly isSome = true;

  public override readonly isNone = false;

  public readonly value!: A;

  public constructor(value: Expression<A>) {
    super();
    define(this, "value", value);
  }

  public static of<A>(value: A): Some<A> {
    return new Some(fromValue(value));
  }
}

export class None extends OptionTrait {
  public override readonly isSome = false;

  public override readonly isNone = true;

  private constructor() {
    super();
  }

  public static readonly instance = new None();
}
