import type { Option } from "./option.js";
import type { PartialOrder, Setoid, TotalOrder } from "./order.js";
import type { Ordering } from "./ordering.js";

import { None, Some } from "./option.js";
import { Pair } from "./pair.js";
import { Task } from "./task.js";

export type Result<A, E> = Okay<A> | Fail<E>;

abstract class ResultTrait {
	public abstract readonly isOkay: boolean;

	public abstract readonly isFail: boolean;

	public toString<A, E>(this: Result<A, E>): string {
		return this.isOkay ? `Okay(${String(this.value)})` : `Fail(${String(this.value)})`;
	}

	public fold<A, E, T>(
		this: Result<A, E>,
		okayMorphism: (value: A) => T,
		failMorphism: (value: E) => T,
	): T {
		return this.isOkay ? okayMorphism(this.value) : failMorphism(this.value);
	}

	public map<A, B, E, F>(
		this: Result<A, E>,
		okayMorphism: (value: A) => B,
		failMorphism: (value: E) => F,
	): Result<B, F> {
		return this.isOkay ? new Okay(okayMorphism(this.value)) : new Fail(failMorphism(this.value));
	}

	public mapOkay<A, B, E>(this: Result<A, E>, morphism: (value: A) => B): Result<B, E> {
		return this.isOkay ? new Okay(morphism(this.value)) : this;
	}

	public mapFail<A, E, F>(this: Result<A, E>, morphism: (value: E) => F): Result<A, F> {
		return this.isFail ? new Fail(morphism(this.value)) : this;
	}

	public replace<A, B, E, F>(this: Result<A, E>, okayValue: B, failValue: F): Result<B, F> {
		return this.isOkay ? new Okay(okayValue) : new Fail(failValue);
	}

	public replaceOkay<A, B, E>(this: Result<A, E>, value: B): Result<B, E> {
		return this.isOkay ? new Okay(value) : this;
	}

	public replaceFail<A, E, F>(this: Result<A, E>, value: F): Result<A, F> {
		return this.isFail ? new Fail(value) : this;
	}

	public and<A, B, E>(this: Result<A, E>, that: Result<B, E>): Result<Pair<A, B>, E> {
		if (this.isFail) return this;
		if (that.isFail) return that;
		return new Okay(new Pair(this.value, that.value));
	}

	public andThen<A, B, E>(this: Result<A, E>, that: Result<B, E>): Result<B, E> {
		return this.isOkay ? that : this;
	}

	public andWhen<A, B, E>(this: Result<A, E>, that: Result<B, E>): Result<A, E> {
		return this.isOkay && that.isFail ? that : this;
	}

	public or<A, E, F>(this: Result<A, E>, that: Result<A, F>): Result<A, Pair<E, F>> {
		if (this.isOkay) return this;
		if (that.isOkay) return that;
		return new Fail(new Pair(this.value, that.value));
	}

	public orElse<A, E, F>(this: Result<A, E>, that: Result<A, F>): Result<A, F> {
		return this.isOkay ? this : that;
	}

	public orErst<A, E, F>(this: Result<A, E>, that: Result<A, F>): Result<A, E> {
		return this.isOkay || that.isFail ? this : that;
	}

	public flatMap<A, B, E, F>(
		this: Result<A, E>,
		okayArrow: (value: A) => Result<B, F>,
		failArrow: (value: E) => Result<B, F>,
	): Result<B, F> {
		return this.isOkay ? okayArrow(this.value) : failArrow(this.value);
	}

	public flatMapOkay<A, B, E>(this: Result<A, E>, arrow: (value: A) => Result<B, E>): Result<B, E> {
		return this.isOkay ? arrow(this.value) : this;
	}

	public flatMapFail<A, E, F>(this: Result<A, E>, arrow: (value: E) => Result<A, F>): Result<A, F> {
		return this.isFail ? arrow(this.value) : this;
	}

	public flattenOkay<A, E>(this: Result<Result<A, E>, E>): Result<A, E> {
		return this.isOkay ? this.value : this;
	}

	public flattenFail<A, E>(this: Result<A, Result<A, E>>): Result<A, E> {
		return this.isFail ? this.value : this;
	}

	public flatMapUntil<A, B, E, F>(
		this: Result<A, E>,
		okayArrow: (value: A) => Result<Result<B, A>, Result<F, E>>,
		failArrow: (value: E) => Result<Result<B, A>, Result<F, E>>,
	): Result<B, F> {
		let result = this.flatMap(okayArrow, failArrow).distribute();
		while (result.isFail) result = result.value.flatMap(okayArrow, failArrow).distribute();
		return result.value;
	}

	public flatMapOkayUntil<A, B, E>(
		this: Result<A, E>,
		arrow: (value: A) => Result<Result<B, A>, E>,
	): Result<B, E> {
		let result = this.flatMapOkay(arrow).exchangeFail();
		while (result.isFail) result = arrow(result.value).exchangeFail();
		return result.value;
	}

	public flatMapFailUntil<A, E, F>(
		this: Result<A, E>,
		arrow: (value: E) => Result<A, Result<F, E>>,
	): Result<A, F> {
		let result = this.flatMapFail(arrow).associateLeft();
		while (result.isFail) result = arrow(result.value).associateLeft();
		return result.value;
	}

	public commute<A>(this: Okay<A>): Fail<A>;
	public commute<A>(this: Fail<A>): Okay<A>;
	public commute<A, B>(this: Result<A, B>): Result<B, A>;
	public commute<A, B>(this: Result<A, B>): Result<B, A> {
		return this.isOkay ? new Fail(this.value) : new Okay(this.value);
	}

	public isOkayAnd<A, B extends A, E>(
		this: Result<A, E>,
		predicate: (value: A) => value is B,
	): this is Okay<B>;
	public isOkayAnd<A, E>(this: Result<A, E>, predicate: (value: A) => boolean): this is Okay<A>;
	public isOkayAnd<A, E>(this: Result<A, E>, predicate: (value: A) => boolean): this is Okay<A> {
		return this.isOkay && predicate(this.value);
	}

	public isFailAnd<A, E, F extends E>(
		this: Result<A, E>,
		predicate: (value: E) => value is F,
	): this is Fail<F>;
	public isFailAnd<A, E>(this: Result<A, E>, predicate: (value: E) => boolean): this is Fail<E>;
	public isFailAnd<A, E>(this: Result<A, E>, predicate: (value: E) => boolean): this is Fail<E> {
		return this.isFail && predicate(this.value);
	}

	public isOkayOr<A, E, F extends E>(
		this: Result<A, E>,
		predicate: (value: E) => value is F,
	): this is Result<A, F>;
	public isOkayOr<A, E>(this: Result<A, E>, predicate: (value: E) => boolean): boolean;
	public isOkayOr<A, E>(this: Result<A, E>, predicate: (value: E) => boolean): boolean {
		return this.isOkay || predicate(this.value);
	}

	public isFailOr<A, B extends A, E>(
		this: Result<A, E>,
		predicate: (value: A) => value is B,
	): this is Result<B, E>;
	public isFailOr<A, E>(this: Result<A, E>, predicate: (value: A) => boolean): boolean;
	public isFailOr<A, E>(this: Result<A, E>, predicate: (value: A) => boolean): boolean {
		return this.isFail || predicate(this.value);
	}

	public transposeMap<A, B, E, F>(
		this: Result<A, E>,
		transposeOkay: (value: A) => Option<B>,
		transposeFail: (value: E) => Option<F>,
	): Option<Result<B, F>> {
		return this.isOkay
			? transposeOkay(this.value).map(Okay.of)
			: transposeFail(this.value).map(Fail.of);
	}

	public transposeMapOkay<A, B, E>(
		this: Result<A, E>,
		transpose: (value: A) => Option<B>,
	): Option<Result<B, E>> {
		return this.isFail ? new Some(this) : transpose(this.value).map(Okay.of);
	}

	public transposeMapFail<A, E, F>(
		this: Result<A, E>,
		transpose: (value: E) => Option<F>,
	): Option<Result<A, F>> {
		return this.isOkay ? new Some(this) : transpose(this.value).map(Fail.of);
	}

	public transpose<A, E>(this: Result<Option<A>, Option<E>>): Option<Result<A, E>> {
		return this.isOkay ? this.value.map(Okay.of) : this.value.map(Fail.of);
	}

	public transposeOkay<A, E>(this: Result<Option<A>, E>): Option<Result<A, E>> {
		return this.isFail ? new Some(this) : this.value.map(Okay.of);
	}

	public transposeFail<A, E>(this: Result<A, Option<E>>): Option<Result<A, E>> {
		return this.isOkay ? new Some(this) : this.value.map(Fail.of);
	}

	public unzipWith<X, Y, A, B, E, F>(
		this: Result<X, Y>,
		unzipOkay: (value: X) => Pair<A, B>,
		unzipFail: (value: Y) => Pair<E, F>,
	): Pair<Result<A, E>, Result<B, F>> {
		return this.isOkay
			? unzipOkay(this.value).map(Okay.of, Okay.of)
			: unzipFail(this.value).map(Fail.of, Fail.of);
	}

	public unzipWithOkay<X, A, B, E>(
		this: Result<X, E>,
		unzip: (value: X) => Pair<A, B>,
	): Pair<Result<A, E>, Result<B, E>> {
		return this.isFail ? Pair.from(this) : unzip(this.value).map(Okay.of, Okay.of);
	}

	public unzipWithFail<Y, A, E, F>(
		this: Result<A, Y>,
		unzip: (value: Y) => Pair<E, F>,
	): Pair<Result<A, E>, Result<A, F>> {
		return this.isOkay ? Pair.from(this) : unzip(this.value).map(Fail.of, Fail.of);
	}

	public unzip<A, B, E, F>(this: Result<Pair<A, B>, Pair<E, F>>): Pair<Result<A, E>, Result<B, F>> {
		return this.isOkay ? this.value.map(Okay.of, Okay.of) : this.value.map(Fail.of, Fail.of);
	}

	public unzipOkay<A, B, E>(this: Result<Pair<A, B>, E>): Pair<Result<A, E>, Result<B, E>> {
		return this.isFail ? Pair.from(this) : this.value.map(Okay.of, Okay.of);
	}

	public unzipFail<A, E, F>(this: Result<A, Pair<E, F>>): Pair<Result<A, E>, Result<A, F>> {
		return this.isOkay ? Pair.from(this) : this.value.map(Fail.of, Fail.of);
	}

	public collectMapFst<X, Y, A, B, C>(
		this: Result<X, Y>,
		okayMorphism: (value: X) => Pair<A, C>,
		failMorphism: (value: Y) => Pair<B, C>,
	): Pair<Result<A, B>, C> {
		return this.isOkay
			? okayMorphism(this.value).mapFst(Okay.of)
			: failMorphism(this.value).mapFst(Fail.of);
	}

	public collectFst<A, B, C>(this: Result<Pair<A, C>, Pair<B, C>>): Pair<Result<A, B>, C> {
		return this.isOkay ? this.value.mapFst(Okay.of) : this.value.mapFst(Fail.of);
	}

	public collectMapSnd<X, Y, A, B, C>(
		this: Result<X, Y>,
		okayMorphism: (value: X) => Pair<A, B>,
		failMorphism: (value: Y) => Pair<A, C>,
	): Pair<A, Result<B, C>> {
		return this.isOkay
			? okayMorphism(this.value).mapSnd(Okay.of)
			: failMorphism(this.value).mapSnd(Fail.of);
	}

	public collectSnd<A, B, C>(this: Result<Pair<A, B>, Pair<A, C>>): Pair<A, Result<B, C>> {
		return this.isOkay ? this.value.mapSnd(Okay.of) : this.value.mapSnd(Fail.of);
	}

	public collectMapOkay<X, Y, A, B, E>(
		this: Result<X, Y>,
		okayMorphism: (value: X) => Result<A, E>,
		failMorphism: (value: Y) => Result<B, E>,
	): Result<Result<A, B>, E> {
		return this.isOkay
			? okayMorphism(this.value).mapOkay(Okay.of)
			: failMorphism(this.value).mapOkay(Fail.of);
	}

	public exchangeMapFail<X, A, E, F>(
		this: Result<X, F>,
		exchange: (value: X) => Result<A, E>,
	): Result<Result<A, F>, E> {
		return this.isFail ? new Okay(this) : exchange(this.value).mapOkay(Okay.of);
	}

	public associateMapLeft<Y, A, B, C>(
		this: Result<A, Y>,
		morphism: (value: Y) => Result<B, C>,
	): Result<Result<A, B>, C> {
		return this.isOkay ? new Okay(this) : morphism(this.value).mapOkay(Fail.of);
	}

	public collectOkay<A, B, E>(this: Result<Result<A, E>, Result<B, E>>): Result<Result<A, B>, E> {
		return this.isOkay ? this.value.mapOkay(Okay.of) : this.value.mapOkay(Fail.of);
	}

	public exchangeFail<A, E, F>(this: Result<Result<A, E>, F>): Result<Result<A, F>, E> {
		return this.isFail ? new Okay(this) : this.value.mapOkay(Okay.of);
	}

	public associateLeft<A, B, C>(this: Result<A, Result<B, C>>): Result<Result<A, B>, C> {
		return this.isOkay ? new Okay(this) : this.value.mapOkay(Fail.of);
	}

	public collectMapFail<X, Y, A, E, F>(
		this: Result<X, Y>,
		okayMorphism: (value: X) => Result<A, E>,
		failMorphism: (value: Y) => Result<A, F>,
	): Result<A, Result<E, F>> {
		return this.isOkay
			? okayMorphism(this.value).mapFail(Okay.of)
			: failMorphism(this.value).mapFail(Fail.of);
	}

	public exchangeMapOkay<Y, A, B, E>(
		this: Result<A, Y>,
		exchange: (value: Y) => Result<B, E>,
	): Result<B, Result<A, E>> {
		return this.isOkay ? new Fail(this) : exchange(this.value).mapFail(Fail.of);
	}

	public associateMapRight<X, A, B, C>(
		this: Result<X, C>,
		morphism: (value: X) => Result<A, B>,
	): Result<A, Result<B, C>> {
		return this.isFail ? new Fail(this) : morphism(this.value).mapFail(Okay.of);
	}

	public collectFail<A, E, F>(this: Result<Result<A, E>, Result<A, F>>): Result<A, Result<E, F>> {
		return this.isOkay ? this.value.mapFail(Okay.of) : this.value.mapFail(Fail.of);
	}

	public exchangeOkay<A, B, E>(this: Result<A, Result<B, E>>): Result<B, Result<A, E>> {
		return this.isOkay ? new Fail(this) : this.value.mapFail(Fail.of);
	}

	public associateRight<A, B, C>(this: Result<Result<A, B>, C>): Result<A, Result<B, C>> {
		return this.isFail ? new Fail(this) : this.value.mapFail(Okay.of);
	}

	public distributeMap<X, Y, A, B, E, F>(
		this: Result<X, Y>,
		okayMorphism: (value: X) => Result<A, B>,
		failMorphism: (value: Y) => Result<E, F>,
	): Result<Result<A, E>, Result<B, F>> {
		return this.isOkay
			? okayMorphism(this.value).map(Okay.of, Okay.of)
			: failMorphism(this.value).map(Fail.of, Fail.of);
	}

	public distribute<A, B, E, F>(
		this: Result<Result<A, B>, Result<E, F>>,
	): Result<Result<A, E>, Result<B, F>> {
		return this.isOkay ? this.value.map(Okay.of, Okay.of) : this.value.map(Fail.of, Fail.of);
	}

	public gatherMapOkay<X, Y, A, B, E>(
		this: Result<X, Y>,
		okayMorphism: (value: X) => Task<A, E>,
		failMorphism: (value: Y) => Task<B, E>,
	): Task<Result<A, B>, E> {
		return this.isOkay
			? okayMorphism(this.value).mapOkay(Okay.of)
			: failMorphism(this.value).mapOkay(Fail.of);
	}

	public swapMapFail<X, A, E, F>(
		this: Result<X, F>,
		morphism: (value: X) => Task<A, E>,
	): Task<Result<A, F>, E> {
		return this.isFail ? Task.okay(this) : morphism(this.value).mapOkay(Okay.of);
	}

	public groupMapLeft<Y, A, B, C>(
		this: Result<A, Y>,
		morphism: (value: Y) => Task<B, C>,
	): Task<Result<A, B>, C> {
		return this.isOkay ? Task.okay(this) : morphism(this.value).mapOkay(Fail.of);
	}

	public gatherOkay<A, B, E>(this: Result<Task<A, E>, Task<B, E>>): Task<Result<A, B>, E> {
		return this.isOkay ? this.value.mapOkay(Okay.of) : this.value.mapOkay(Fail.of);
	}

	public swapFail<A, E, F>(this: Result<Task<A, E>, F>): Task<Result<A, F>, E> {
		return this.isFail ? Task.okay(this) : this.value.mapOkay(Okay.of);
	}

	public groupLeft<A, B, C>(this: Result<A, Task<B, C>>): Task<Result<A, B>, C> {
		return this.isOkay ? Task.okay(this) : this.value.mapOkay(Fail.of);
	}

	public gatherMapFail<X, Y, A, E, F>(
		this: Result<X, Y>,
		okayMorphism: (value: X) => Task<A, E>,
		failMorphism: (value: Y) => Task<A, F>,
	): Task<A, Result<E, F>> {
		return this.isOkay
			? okayMorphism(this.value).mapFail(Okay.of)
			: failMorphism(this.value).mapFail(Fail.of);
	}

	public swapMapOkay<Y, A, B, E>(
		this: Result<A, Y>,
		morphism: (value: Y) => Task<B, E>,
	): Task<B, Result<A, E>> {
		return this.isOkay ? Task.fail(this) : morphism(this.value).mapFail(Fail.of);
	}

	public groupMapRight<X, A, B, C>(
		this: Result<X, C>,
		morphism: (value: X) => Task<A, B>,
	): Task<A, Result<B, C>> {
		return this.isFail ? Task.fail(this) : morphism(this.value).mapFail(Okay.of);
	}

	public gatherFail<A, E, F>(this: Result<Task<A, E>, Task<A, F>>): Task<A, Result<E, F>> {
		return this.isOkay ? this.value.mapFail(Okay.of) : this.value.mapFail(Fail.of);
	}

	public swapOkay<A, B, E>(this: Result<A, Task<B, E>>): Task<B, Result<A, E>> {
		return this.isOkay ? Task.fail(this) : this.value.mapFail(Fail.of);
	}

	public groupRight<A, B, C>(this: Result<Task<A, B>, C>): Task<A, Result<B, C>> {
		return this.isFail ? Task.fail(this) : this.value.mapFail(Okay.of);
	}

	public interchangeMap<X, Y, A, B, E, F>(
		this: Result<X, Y>,
		okayMorphism: (value: X) => Task<A, B>,
		failMorphism: (value: Y) => Task<E, F>,
	): Task<Result<A, E>, Result<B, F>> {
		return this.isOkay
			? okayMorphism(this.value).map(Okay.of, Okay.of)
			: failMorphism(this.value).map(Fail.of, Fail.of);
	}

	public interchange<A, B, E, F>(
		this: Result<Task<A, B>, Task<E, F>>,
	): Task<Result<A, E>, Result<B, F>> {
		return this.isOkay ? this.value.map(Okay.of, Okay.of) : this.value.map(Fail.of, Fail.of);
	}

	public extractOkay<A, E>(this: Result<A, E>, defaultValue: A): A {
		return this.isOkay ? this.value : defaultValue;
	}

	public extractFail<A, E>(this: Result<A, E>, defaultValue: E): E {
		return this.isFail ? this.value : defaultValue;
	}

	public extractMapOkay<A, E>(this: Result<A, E>, getOkayValue: (value: E) => A): A {
		return this.isOkay ? this.value : getOkayValue(this.value);
	}

	public extractMapFail<A, E>(this: Result<A, E>, getFailValue: (value: A) => E): E {
		return this.isFail ? this.value : getFailValue(this.value);
	}

	public toOptionOkay<A, E>(this: Result<A, E>): Option<A> {
		return this.isOkay ? new Some(this.value) : None.instance;
	}

	public toOptionFail<A, E>(this: Result<A, E>): Option<E> {
		return this.isFail ? new Some(this.value) : None.instance;
	}

	public toTask<A, E>(this: Result<A, E>): Task<A, E> {
		return new Task((signal, callback) => {
			/* v8 ignore else -- @preserve */
			if (!signal.aborted) callback(this);
		});
	}

	public isSame<A extends Setoid<A>, E extends Setoid<E>>(
		this: Result<A, E>,
		that: Result<A, E>,
	): boolean {
		return this.isOkay
			? that.isOkay && this.value.isSame(that.value)
			: that.isFail && this.value.isSame(that.value);
	}

	public isNotSame<A extends Setoid<A>, E extends Setoid<E>>(
		this: Result<A, E>,
		that: Result<A, E>,
	): boolean {
		return this.isOkay
			? that.isFail || this.value.isNotSame(that.value)
			: that.isOkay || this.value.isNotSame(that.value);
	}

	public isLess<A extends PartialOrder<A>, E extends PartialOrder<E>>(
		this: Result<A, E>,
		that: Result<A, E>,
	): boolean {
		return this.isOkay
			? that.isOkay && this.value.isLess(that.value)
			: that.isOkay || this.value.isLess(that.value);
	}

	public isNotLess<A extends PartialOrder<A>, E extends PartialOrder<E>>(
		this: Result<A, E>,
		that: Result<A, E>,
	): boolean {
		return this.isOkay
			? that.isFail || this.value.isNotLess(that.value)
			: that.isFail && this.value.isNotLess(that.value);
	}

	public isMore<A extends PartialOrder<A>, E extends PartialOrder<E>>(
		this: Result<A, E>,
		that: Result<A, E>,
	): boolean {
		return this.isOkay
			? that.isFail || this.value.isMore(that.value)
			: that.isFail && this.value.isMore(that.value);
	}

	public isNotMore<A extends PartialOrder<A>, E extends PartialOrder<E>>(
		this: Result<A, E>,
		that: Result<A, E>,
	): boolean {
		return this.isOkay
			? that.isOkay && this.value.isNotMore(that.value)
			: that.isOkay || this.value.isNotMore(that.value);
	}

	public compare<A extends PartialOrder<A>, E extends PartialOrder<E>>(
		this: Result<A, E>,
		that: Result<A, E>,
	): Option<Ordering> {
		return this.isFail
			? that.isOkay
				? new Some("<")
				: this.value.compare(that.value)
			: that.isFail
				? new Some(">")
				: this.value.compare(that.value);
	}

	public max<A extends TotalOrder<A>, E extends TotalOrder<E>>(
		this: Result<A, E>,
		that: Result<A, E>,
	): Result<A, E> {
		return this.isOkay
			? that.isFail
				? this
				: new Okay(this.value.max(that.value))
			: that.isOkay
				? that
				: new Fail(this.value.max(that.value));
	}

	public min<A extends TotalOrder<A>, E extends TotalOrder<E>>(
		this: Result<A, E>,
		that: Result<A, E>,
	): Result<A, E> {
		return this.isOkay
			? that.isFail
				? that
				: new Okay(this.value.min(that.value))
			: that.isOkay
				? this
				: new Fail(this.value.min(that.value));
	}

	public clamp<A extends TotalOrder<A>, E extends TotalOrder<E>>(
		this: Result<A, E>,
		lower: Result<A, E>,
		upper: Result<A, E>,
	): Result<A, E> {
		return this.max(lower).min(upper);
	}

	public *okayValues<A, E>(this: Result<A, E>): Generator<A, void, undefined> {
		if (this.isOkay) yield this.value;
	}

	public *failValues<A, E>(this: Result<A, E>): Generator<E, void, undefined> {
		if (this.isFail) yield this.value;
	}

	public *values<A, E>(this: Result<A, E>): Generator<A | E, void, undefined> {
		yield this.value;
	}

	public *effectMap<A, B, E>(
		this: Result<A, E>,
		morphism: (value: A) => B,
	): Generator<Result<A, E>, B, A> {
		const value = yield this;
		return morphism(value);
	}

	public *effect<A, E>(this: Result<A, E>): Generator<Result<A, E>, A, A> {
		const value = yield this;
		return value;
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

	// TODO: <A, B>(getGenerator: () => Generator<Result<A, unknown>, B, A>) => Result<B, unknown>
	public static fromGenerator<A>(
		getGenerator: () => Generator<Result<unknown, unknown>, A, unknown>,
	): Result<A, unknown> {
		const generator = getGenerator();

		let iteratorResult: IteratorResult<Result<unknown, unknown>, A>;

		try {
			iteratorResult = generator.next();
		} catch (error) {
			return new Fail(error);
		}

		while (!iteratorResult.done) {
			const result = iteratorResult.value;
			try {
				iteratorResult = result.isOkay
					? generator.next(result.value)
					: generator.throw(result.value);
			} catch (error) {
				return new Fail(error);
			}
		}

		return new Okay(iteratorResult.value);
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
