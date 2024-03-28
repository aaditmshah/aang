export class Pair<out A, out B> {
  public constructor(
    public readonly fst: A,
    public readonly snd: B,
  ) {}

  public static of<A>(value: A): Pair<A, A> {
    return new Pair(value, value);
  }

  public map<A, B, C, D>(
    this: Pair<A, B>,
    fstMorphism: (fst: A) => C,
    sndMorphism: (snd: B) => D,
  ): Pair<C, D> {
    return new Pair(fstMorphism(this.fst), sndMorphism(this.snd));
  }

  public mapFst<A, B, C>(
    this: Pair<A, C>,
    morphism: (fst: A) => B,
  ): Pair<B, C> {
    return new Pair(morphism(this.fst), this.snd);
  }

  public mapSnd<A, B, C>(
    this: Pair<A, B>,
    morphism: (snd: B) => C,
  ): Pair<A, C> {
    return new Pair(this.fst, morphism(this.snd));
  }

  public associateLeft<A, B, C>(
    this: Pair<A, Pair<B, C>>,
  ): Pair<Pair<A, B>, C> {
    return new Pair(new Pair(this.fst, this.snd.fst), this.snd.snd);
  }

  public associateRight<A, B, C>(
    this: Pair<Pair<A, B>, C>,
  ): Pair<A, Pair<B, C>> {
    return new Pair(this.fst.fst, new Pair(this.fst.snd, this.snd));
  }
}
