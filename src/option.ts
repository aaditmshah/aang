import { UnsafeExtractError } from "./errors.js";
import { Exception } from "./exceptions.js";

export type Option<A> = Some<A> | None;

abstract class OptionMethods {
  public abstract readonly isSome: boolean;

  public abstract readonly isNone: boolean;

  public map<A, B>(this: Option<A>, morphism: (value: A) => B): Option<B> {
    return this.isSome ? new Some(morphism(this.value)) : none;
  }

  public unsafeExtract<A>(this: Option<A>, error: Exception | string): A {
    if (this.isSome) return this.value;
    throw error instanceof Exception ? error : new UnsafeExtractError(error);
  }
}

class Some<out A> extends OptionMethods {
  public override readonly isSome = true;

  public override readonly isNone = false;

  public constructor(public readonly value: A) {
    super();
  }
}

class None extends OptionMethods {
  public override readonly isSome = false;

  public override readonly isNone = true;
}

export const some = <A>(value: A): Some<A> => new Some(value);

export const none = new None();

export type { Some, None };
