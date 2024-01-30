export type Result<E, A> = Success<A> | Failure<E>;

abstract class ResultMethods {
  public abstract readonly isSuccess: boolean;

  public abstract readonly isFailure: boolean;

  public map<E, A, B>(
    this: Result<E, A>,
    morphism: (value: A) => B,
  ): Result<E, B> {
    return this.isSuccess ? new Success(morphism(this.value)) : this;
  }
}

export class Success<out A> extends ResultMethods {
  public override readonly isSuccess = true;

  public override readonly isFailure = false;

  public constructor(public readonly value: A) {
    super();
  }
}

export class Failure<out E> extends ResultMethods {
  public override readonly isSuccess = false;

  public override readonly isFailure = true;

  public constructor(public readonly error: E) {
    super();
  }
}
