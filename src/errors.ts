import { Exception } from "./exceptions.js";

export class UnsafeExtractError extends Exception {
  public constructor(message: string) {
    super(message);
    this.setName("UnsafeExtractError");
  }
}
