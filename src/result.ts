import type { Expression } from "./expression.js";
import { define, fromValue } from "./expression.js";

export type Result<E, A> = Success<A> | Failure<E>;

abstract class ResultTrait {
  public abstract readonly isSuccess: boolean;

  public abstract readonly isFailure: boolean;

  public map<E, A, B>(
    this: Result<E, A>,
    morphism: (value: A) => B,
  ): Result<E, B> {
    return this.isSuccess ? Success.of(morphism(this.value)) : this;
  }

  public mapFailure<E, F, A>(
    this: Result<E, A>,
    morphism: (error: E) => F,
  ): Result<F, A> {
    return this.isFailure ? Failure.of(morphism(this.error)) : this;
  }
}

export class Success<out A> extends ResultTrait {
  public override readonly isSuccess = true;

  public override readonly isFailure = false;

  public readonly value!: A;

  public constructor(value: Expression<A>) {
    super();
    define(this, "value", value);
  }

  public static of<A>(value: A): Success<A> {
    return new Success(fromValue(value));
  }
}

export class Failure<out E> extends ResultTrait {
  public override readonly isSuccess = false;

  public override readonly isFailure = true;

  public readonly error!: E;

  public constructor(error: Expression<E>) {
    super();
    define(this, "error", error);
  }

  public static of<E>(error: E): Failure<E> {
    return new Failure(fromValue(error));
  }
}
