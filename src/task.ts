import type { Option } from "./option.js";
import { None, Some } from "./option.js";
import { Pair } from "./pair.js";
import type { Result } from "./result.js";
import { Fail, Okay } from "./result.js";

export class Task<out A, out E> {
  public constructor(
    public readonly execute: (
      signal: AbortSignal,
      callback: (result: Result<A, E>) => void,
    ) => void,
  ) {}

  public static okay<A>(value: A): Task<A, never> {
    return new Task((signal, callback) => {
      if (!signal.aborted) callback(new Okay(value));
    });
  }

  public static fail<E>(value: E): Task<never, E> {
    return new Task((signal, callback) => {
      if (!signal.aborted) callback(new Fail(value));
    });
  }

  public static of<A, E>(
    task: (
      callback: (result: Result<A, E>) => void,
    ) => (reason: unknown) => void,
  ): Task<A, E> {
    return new Task((signal, callback) => {
      const abort = task((result) => {
        if (!signal.aborted) {
          signal.removeEventListener("abort", onAbort);
          callback(result);
        }
      });

      signal.addEventListener("abort", onAbort);

      function onAbort() {
        signal.removeEventListener("abort", onAbort);
        abort(signal.reason);
      }
    });
  }

  public run<A, E>(
    this: Task<A, E>,
    callback: (result: Result<A, E>) => void,
  ): AbortController {
    const controller = new AbortController();
    this.execute(controller.signal, callback);
    return controller;
  }

  public map<A, B, E, F>(
    this: Task<A, E>,
    okayMorphism: (value: A) => B,
    failMorphism: (value: E) => F,
  ): Task<B, F> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) =>
        callback(result.map(okayMorphism, failMorphism)),
      ),
    );
  }

  public mapOkay<A, B, E>(
    this: Task<A, E>,
    morphism: (value: A) => B,
  ): Task<B, E> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) => callback(result.mapOkay(morphism))),
    );
  }

  public mapFail<A, E, F>(
    this: Task<A, E>,
    morphism: (value: E) => F,
  ): Task<A, F> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) => callback(result.mapFail(morphism))),
    );
  }

  public replace<A, B, E, F>(
    this: Task<A, E>,
    okayValue: B,
    failValue: F,
  ): Task<B, F> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) =>
        callback(result.replace(okayValue, failValue)),
      ),
    );
  }

  public replaceOkay<A, B, E>(this: Task<A, E>, value: B): Task<B, E> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) => callback(result.replaceOkay(value))),
    );
  }

  public replaceFail<A, E, F>(this: Task<A, E>, value: F): Task<A, F> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) => callback(result.replaceFail(value))),
    );
  }

  public and<A, B, E>(this: Task<A, E>, that: Task<B, E>): Task<Pair<A, B>, E> {
    return Task.of((callback) => {
      const controller = new AbortController();

      let fst: Option<A> = None.instance;
      let snd: Option<B> = None.instance;

      this.execute(controller.signal, (result) => {
        if (result.isFail) {
          if (snd.isNone) controller.abort();
          callback(result);
        } else if (snd.isNone) fst = new Some(result.value);
        else callback(new Okay(new Pair(result.value, snd.value)));
      });

      that.execute(controller.signal, (result) => {
        if (result.isFail) {
          if (fst.isNone) controller.abort();
          callback(result);
        } else if (fst.isNone) snd = new Some(result.value);
        else callback(new Okay(new Pair(fst.value, result.value)));
      });

      return (reason) => controller.abort(reason);
    });
  }

  public andThen<A, B, E>(this: Task<A, E>, that: Task<B, E>): Task<B, E> {
    return this.and(that).mapOkay((pair) => pair.snd);
  }

  public andWhen<A, B, E>(this: Task<A, E>, that: Task<B, E>): Task<A, E> {
    return this.and(that).mapOkay((pair) => pair.fst);
  }

  public or<A, E, F>(this: Task<A, E>, that: Task<A, F>): Task<A, Pair<E, F>> {
    return Task.of((callback) => {
      const controller = new AbortController();

      let fst: Option<E> = None.instance;
      let snd: Option<F> = None.instance;

      this.execute(controller.signal, (result) => {
        if (result.isOkay) {
          if (snd.isNone) controller.abort();
          callback(result);
        } else if (snd.isNone) fst = new Some(result.value);
        else callback(new Fail(new Pair(result.value, snd.value)));
      });

      that.execute(controller.signal, (result) => {
        if (result.isOkay) {
          if (fst.isNone) controller.abort();
          callback(result);
        } else if (fst.isNone) snd = new Some(result.value);
        else callback(new Fail(new Pair(fst.value, result.value)));
      });

      return (reason) => controller.abort(reason);
    });
  }

  public orElse<A, E, F>(this: Task<A, E>, that: Task<A, F>): Task<A, F> {
    return this.or(that).mapFail((pair) => pair.snd);
  }

  public orErst<A, E, F>(this: Task<A, E>, that: Task<A, F>): Task<A, E> {
    return this.or(that).mapFail((pair) => pair.fst);
  }

  public flatMap<A, B, E, F>(
    this: Task<A, E>,
    okayArrow: (value: A) => Task<B, F>,
    failArrow: (value: E) => Task<B, F>,
  ): Task<B, F> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) =>
        result.isOkay
          ? okayArrow(result.value).execute(signal, callback)
          : failArrow(result.value).execute(signal, callback),
      ),
    );
  }

  public flatMapOkay<A, B, E>(
    this: Task<A, E>,
    arrow: (value: A) => Task<B, E>,
  ): Task<B, E> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) =>
        result.isOkay
          ? arrow(result.value).execute(signal, callback)
          : callback(result),
      ),
    );
  }

  public flatMapFail<A, E, F>(
    this: Task<A, E>,
    arrow: (value: E) => Task<A, F>,
  ): Task<A, F> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) =>
        result.isFail
          ? arrow(result.value).execute(signal, callback)
          : callback(result),
      ),
    );
  }

  public flatten<A, E>(this: Task<Task<A, E>, Task<A, E>>): Task<A, E> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) => result.value.execute(signal, callback)),
    );
  }

  public flattenOkay<A, E>(this: Task<Task<A, E>, E>): Task<A, E> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) =>
        result.isOkay
          ? result.value.execute(signal, callback)
          : callback(result),
      ),
    );
  }

  public flattenFail<A, E>(this: Task<A, Task<A, E>>): Task<A, E> {
    return new Task((signal, callback) =>
      this.execute(signal, (result) =>
        result.isFail
          ? result.value.execute(signal, callback)
          : callback(result),
      ),
    );
  }

  public flatMapUntil<A, B, E, F>(
    this: Task<A, E>,
    okayArrow: (value: A) => Task<Result<B, A>, Result<F, E>>,
    failArrow: (value: E) => Task<Result<B, A>, Result<F, E>>,
  ): Task<B, F> {
    return new Task((signal, callback) => {
      const trampoline = (task: Task<A, E>): void => {
        let option: Option<Task<A, E>> = new Some(task);

        while (option.isSome) {
          const task = option.value;

          option = None.instance;

          let isAsync = false;

          task.flatMap(okayArrow, failArrow).execute(signal, (value) => {
            const result = value.distribute();
            if (result.isOkay) callback(result.value);
            else if (isAsync) trampoline(result.value.toTask());
            else option = new Some(result.value.toTask());
          });

          isAsync = true;
        }
      };

      trampoline(this);
    });
  }

  public flatMapOkayUntil<A, B, E>(
    this: Task<A, E>,
    arrow: (value: A) => Task<Result<B, A>, E>,
  ): Task<B, E> {
    return new Task((signal, callback) => {
      const trampoline = (task: Task<A, E>): void => {
        let option: Option<Task<A, E>> = new Some(task);

        while (option.isSome) {
          const task = option.value;

          option = None.instance;

          let isAsync = false;

          task.flatMapOkay(arrow).execute(signal, (value) => {
            const result = value.exchangeFail();
            if (result.isOkay) callback(result.value);
            else if (isAsync) trampoline(Task.okay(result.value));
            else option = new Some(Task.okay(result.value));
          });

          isAsync = true;
        }
      };

      trampoline(this);
    });
  }

  public flatMapFailUntil<A, E, F>(
    this: Task<A, E>,
    arrow: (value: E) => Task<A, Result<F, E>>,
  ): Task<A, F> {
    return new Task((signal, callback) => {
      const trampoline = (task: Task<A, E>): void => {
        let option: Option<Task<A, E>> = new Some(task);

        while (option.isSome) {
          const task = option.value;

          option = None.instance;

          let isAsync = false;

          task.flatMapFail(arrow).execute(signal, (value) => {
            const result = value.associateLeft();
            if (result.isOkay) callback(result.value);
            else if (isAsync) trampoline(Task.fail(result.value));
            else option = new Some(Task.fail(result.value));
          });

          isAsync = true;
        }
      };

      trampoline(this);
    });
  }
}
