import type { Result } from './01_implementations';

type Union<r, v> = Pure<r, v> | Chain<r, v>;

export type { Reader };
abstract class Reader<r, v> {
  abstract apReader<w>(ff: Reader<r, (_: v) => w>): Reader<r, w>;
  chainReader<s, a, e>(
    f: (_: v) => Reader<s, Result<a, e>>
  ): Parser<r & s, a, e>;
  chainReader<s, w>(f: (_: v) => Reader<s, w>): Reader<r & s, w>;
  chainReader<s, w>(
    this: Union<r, v>,
    f: (_: v) => Union<s, w>
  ): Reader<r & s, w> {
    return new Chain<r & s, w>(this, f);
  }
  mapReader<a, e>(f: (_: v) => Result<a, e>): Parser<r, a, e>;
  mapReader<w>(f: (_: v) => w): Reader<r, w>;
  mapReader<w>(this: Union<r, v>, f: (_: v) => w): Reader<r, w> {
    return new Chain(this, v => new Pure(_ => f(v)));
  }
  abstract run(env: r): v;

  catch<a, e, b, g>(
    this: Parser<r, a, e>,
    f: (_: e) => Result<b, g>
  ): Parser<r, a | b, g> {
    return this.mapReader(res => res.catch(f));
  }
  catchParser<a, e, s, b, g>(
    this: Parser<r, a, e>,
    f: (_: e) => Parser<s, b, g>
  ): Parser<r & s, a | b, g> {
    return new Chain(
      this as Union<r, Result<a, e>>,
      res => new Pure((env: r & s) => res.catch(e => f(e).run(env)))
    );
  }
  chain<a, e, b, g>(
    this: Parser<r, a, e>,
    f: (_: a) => Result<b, g>
  ): Parser<r, b, e | g> {
    return this.mapReader(res => res.chain(f));
  }
  chainParser<a, e, s, b, g>(
    this: Parser<r, a, e>,
    f: (_: a) => Parser<s, b, g>
  ): Parser<r & s, b, e | g> {
    return new Chain(
      this as Union<r, Result<a, e>>,
      res => new Pure((env: r & s) => res.chain(a => f(a).run(env)))
    );
  }
  map<a, e, b>(this: Parser<r, a, e>, f: (_: a) => b): Parser<r, b, e> {
    return this.mapReader(res => res.map(f));
  }
  mapErr<a, e, g>(this: Parser<r, a, e>, f: (_: e) => g): Parser<r, a, g> {
    return this.mapReader(res => res.mapErr(f));
  }
}

class Pure<r, v> extends Reader<r, v> {
  readonly pure: true;
  readonly run: (_: r) => v;
  constructor(run: (_: r) => v) {
    super();
    this.pure = true;
    this.run = run;
  }
  apReader<w>(ff: Reader<r, (_: v) => w>): Reader<r, w>;
  apReader<w>(ff: Union<r, (_: v) => w>): Reader<r, w> {
    if (ff.pure) return new Pure(env => ff.run(env)(this.run(env)));
    return new Chain(ff.fa, f0 => this.apReader(ff.f(f0)) as Union<r, w>);
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
  apReader<w>(ff: Reader<r, (_: v) => w>): Reader<r, w>;
  apReader<w>(ff: Union<r, (_: v) => w>): Reader<r, w> {
    if (ff.pure) {
      return new Chain(this.fa, a0 => this.f(a0).apReader(ff) as Union<r, w>);
    } else {
      return new Chain(
        this.fa,
        a0 =>
          new Chain(ff.fa, f0 => this.f(a0).apReader(ff.f(f0)) as Union<r, w>)
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
    fa.apReader(fb.mapReader(b => (a: a) => f(a, b)));

export interface Parser<r, a, e> extends Reader<r, Result<a, e>> {}
export const parser: {
  <r, e, a>(run: (env: r) => Result<a, e>): Parser<r, a, e>;
} = reader;
