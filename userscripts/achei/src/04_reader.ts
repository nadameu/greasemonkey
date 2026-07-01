type Union<r, v> = Pure<r, v> | Chain<r, v>;

export type { Reader };
abstract class Reader<r, v> {
  abstract ap<w>(ff: Reader<r, (_: v) => w>): Reader<r, w>;
  chain<w>(f: (_: v) => Reader<r, w>): Reader<r, w>;
  chain<w>(this: Union<r, v>, f: (_: v) => Union<r, w>): Reader<r, w> {
    return new Chain(this, f);
  }
  map<w>(f: (_: v) => w): Reader<r, w>;
  map<w>(this: Union<r, v>, f: (_: v) => w): Reader<r, w> {
    return new Chain(this, v => new Pure(_ => f(v)));
  }
  abstract run(env: r): v;
}

class Pure<r, v> extends Reader<r, v> {
  readonly pure: true;
  readonly run: (_: r) => v;
  constructor(run: (_: r) => v) {
    super();
    this.pure = true;
    this.run = run;
  }
  ap<w>(ff: Reader<r, (_: v) => w>): Reader<r, w>;
  ap<w>(ff: Union<r, (_: v) => w>): Reader<r, w> {
    if (ff.pure) return new Pure(env => ff.run(env)(this.run(env)));
    return new Chain(ff.fa, f0 => this.ap(ff.f(f0)) as Union<r, w>);
  }
}
export const reader = <r, v>(run: (_: r) => v): Reader<r, v> => new Pure(run);

class Chain<r, v, u = any> extends Reader<r, v> {
  readonly pure: false;
  readonly fa: Union<r, u>;
  readonly f: (_: u) => Union<r, v>;
  private readonly _depth: number;
  constructor(fa: Union<r, u>, f: (_: u) => Union<r, v>) {
    super();
    this.pure = false;
    this.fa = fa;
    this.f = f;
    this._depth = fa.pure ? 1 : fa._depth + 1;
  }
  ap<w>(ff: Reader<r, (_: v) => w>): Reader<r, w>;
  ap<w>(ff: Union<r, (_: v) => w>): Reader<r, w> {
    if (ff.pure) {
      return new Chain(this.fa, a0 => this.f(a0).ap(ff) as Union<r, w>);
    } else {
      return new Chain(
        this.fa,
        a0 => new Chain(ff.fa, f0 => this.f(a0).ap(ff.f(f0)) as Union<r, w>)
      );
    }
  }
  private _step(env: r): Union<r, v> {
    const prev = this.fa;
    if (prev.pure) return this.f(prev.run(env));
    else return new Chain(prev.fa, v => new Chain(prev.f(v), this.f));
  }
  run(env: r): v {
    let curr: Union<r, v> = this;
    while (!curr.pure) curr = curr._step(env);
    return curr.run(env);
  }
}

export const lift2 =
  <a, b, c>(f: (a: a, b: b) => c) =>
  <r>(fa: Reader<r, a>, fb: Reader<r, b>): Reader<r, c> =>
    fa.ap(fb.map(b => a => f(a, b)));
