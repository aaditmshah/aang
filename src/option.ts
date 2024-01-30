import { UnsafeExtractError } from "./errors.js";
import { Exception } from "./exceptions.js";
import type { Result } from "./result.js";
import { Failure, Success } from "./result.js";

export type Option<A> = Some<A> | None;

abstract class OptionMethods {
  public abstract readonly isSome: boolean;

  public abstract readonly isNone: boolean;

  public map<A, B>(this: Option<A>, morphism: (value: A) => B): Option<B> {
    return this.isSome ? new Some(morphism(this.value)) : None.instance;
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

  public safeExtract<A>(this: Option<A>, getDefaultValue: () => A): A {
    return this.isSome ? this.value : getDefaultValue();
  }

  public unsafeExtract<A>(this: Option<A>, error: Exception | string): A {
    if (this.isSome) return this.value;
    throw error instanceof Exception ? error : new UnsafeExtractError(error);
  }

  public toResult<E, A>(this: Option<A>, getError: () => E): Result<E, A> {
    return this.isSome ? new Success(this.value) : new Failure(getError());
  }

  public *[Symbol.iterator]<A>(this: Option<A>): Generator<A, void, undefined> {
    if (this.isSome) yield this.value;
  }
}

export class Some<out A> extends OptionMethods {
  public override readonly isSome = true;

  public override readonly isNone = false;

  public constructor(public readonly value: A) {
    super();
  }
}

export class None extends OptionMethods {
  public override readonly isSome = false;

  public override readonly isNone = true;

  private constructor() {
    super();
  }

  public static readonly instance = new None();
}
