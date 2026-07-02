import type { Result } from './01_implementations';

type Union<r, v> = Pure<r, v> | Chain<r, v>;

export type { Reader };
abstract class Reader<r, v> {
  abstract apReader<w>(ff: Reader<r, (_: v) => w>): Reader<r, w>;

  declare catch: {
    <a, e, b, g>(
      this: Parser<r, a, e>,
      f: (_: e) => Result<b, g>
    ): Parser<r, a | b, g>;
  };
  declare catchParser: {
    <a, e, s, b, g>(
      this: Parser<r, a, e>,
      f: (_: e) => Parser<s, b, g>
    ): Parser<r & s, a | b, g>;
  };
  declare chain: {
    <a, e, b, g>(
      this: Parser<r, a, e>,
      f: (_: a) => Result<b, g>
    ): Parser<r, b, e | g>;
  };
  declare chainParser: {
    <a, e, s, b, g>(
      this: Parser<r, a, e>,
      f: (_: a) => Parser<s, b, g>
    ): Parser<r & s, b, e | g>;
  };
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
  declare map: {
    <a, e, b>(this: Parser<r, a, e>, f: (_: a) => b): Parser<r, b, e>;
  };
  declare mapErr: {
    <a, e, g>(this: Parser<r, a, e>, f: (_: e) => g): Parser<r, a, g>;
  };
  mapReader<a, e>(f: (_: v) => Result<a, e>): Parser<r, a, e>;
  mapReader<w>(f: (_: v) => w): Reader<r, w>;
  mapReader<w>(this: Union<r, v>, f: (_: v) => w): Reader<r, w> {
    return new Chain(this, v => new Pure(_ => f(v)));
  }
  abstract run(env: r): v;
}
for (const method of ['catch', 'chain', 'map', 'mapErr'] as const) {
  Reader.prototype[method] = function (f: Function) {
    return this.mapReader(res => res[method](f));
  };
}
for (const prefix of ['catch', 'chain'] as const) {
  Reader.prototype[`${prefix}Parser`] = function (f: Function) {
    return new Chain(
      this as Union<any, Result<any, any>>,
      res => new Pure(env => res[prefix](x => f(x).run(env)))
    );
  };
}

class Pure<r, v> extends Reader<r, v> {
  readonly pure: true = true;
  constructor(readonly run: (_: r) => v) {
    super();
  }
  apReader<w>(ff: Reader<r, (_: v) => w>): Reader<r, w>;
  apReader<w>(ff: Union<r, (_: v) => w>): Reader<r, w> {
    if (ff.pure) return new Pure(env => ff.run(env)(this.run(env)));
    return new Chain(ff.fa, f0 => this.apReader(ff.f(f0)) as Union<r, w>);
  }
}
export const reader = <r, v>(run: (_: r) => v): Reader<r, v> => new Pure(run);

class Chain<r, v, u = any> extends Reader<r, v> {
  readonly pure: false = false;
  constructor(
    readonly fa: Union<r, u>,
    readonly f: (_: u) => Union<r, v>
  ) {
    super();
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
    const { fa: prev, f: next } = this;
    if (prev.pure) {
      return next(prev.run(env));
    } else {
      return new Chain(prev.fa, a0 => new Chain(prev.f(a0), next));
    }
  }
  run(env: r): v {
    let curr = this._step(env);
    while (!curr.pure) {
            curr = curr._step(env);
    }
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
