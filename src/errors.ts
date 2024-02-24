import { Exception } from "./exceptions.js";

export class UnsafeExtractError extends Exception {
  public constructor(message: string) {
    super(message);
    this.setName("UnsafeExtractError");
  }
}

export class ComparabilityError<out A> extends Exception {
  public constructor(
    public readonly fst: A,
    public readonly snd: A,
  ) {
    super("The `fst` and `snd` values are not comparable.");
    this.setName("ComparabilityError");
  }
}
