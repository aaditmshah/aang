export type Result<E, A> = Okay<A> | Fail<E>;

abstract class ResultTrait {
  public abstract readonly isOkay: boolean;

  public abstract readonly isFail: boolean;

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
