export type Ordering = "<" | "=" | ">";

export const isSame = (x: Ordering): x is "=" => x === "=";

export const isNotSame = (x: Ordering): x is "<" | ">" => x !== "=";

export const isLess = (x: Ordering): x is "<" => x === "<";

export const isNotLess = (x: Ordering): x is ">" | "=" => x !== "<";

export const isMore = (x: Ordering): x is ">" => x === ">";

export const isNotMore = (x: Ordering): x is "<" | "=" => x !== ">";
