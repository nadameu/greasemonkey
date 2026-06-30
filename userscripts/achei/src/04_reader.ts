export type FreeReader<In, Out> = Pure<In, Out> | Chain<In, Out>;

abstract class FreeReaderCommon<In, Out> {
  abstract readonly pure: boolean;
  abstract ap<Next>(ff: FreeReader<In, (_: Out) => Next>): FreeReader<In, Next>;
  chain<Next>(f: (_: Out) => FreeReader<In, Next>): FreeReader<In, Next> {
    return new Chain(this as unknown as FreeReader<In, Out>, f);
  }
  map<Next>(f: (_: Out) => Next): FreeReader<In, Next> {
    return this.chain(x => new Pure(_ => f(x)));
  }
  abstract run(env: In): Out;
}

export type { Pure };
class Pure<In, Out> extends FreeReaderCommon<In, Out> {
  readonly pure: true;
  readonly run: (_: In) => Out;
  constructor(run: Pure<In, Out>['run']) {
    super();
    this.pure = true;
    this.run = run;
  }
  ap<Next>(ff: FreeReader<In, (_: Out) => Next>): FreeReader<In, Next> {
    if (ff.pure) return new Pure(env => ff.run(env)(this.run(env)));
    return ff.fa.chain(f0 => this.ap(ff.f(f0)));
  }
}
export const reader = <In, Out>(run: (_: In) => Out): FreeReader<In, Out> =>
  new Pure(run);

export type { Chain };
class Chain<In, Out, Temp = any> extends FreeReaderCommon<In, Out> {
  readonly pure: false;
  readonly fa: FreeReader<In, Temp>;
  readonly f: (_: Temp) => FreeReader<In, Out>;
  constructor(fa: Chain<In, Out, Temp>['fa'], f: Chain<In, Out, Temp>['f']) {
    super();
    this.pure = false;
    this.fa = fa;
    this.f = f;
  }
  ap<Next>(ff: FreeReader<In, (_: Out) => Next>): FreeReader<In, Next> {
    if (ff.pure) return this.fa.chain(a0 => this.f(a0).ap(ff));
    return this.fa.chain(a0 => ff.fa.chain(f0 => this.f(a0).ap(ff.f(f0))));
  }
  step(env: In): FreeReader<In, Out> {
    if (this.fa.pure) {
      return this.f(this.fa.run(env));
    } else {
      const { fa: prev, f: next } = this.fa;
      return prev.chain(v => next(v).chain(this.f));
    }
  }
  run(env: In): Out {
    let curr: FreeReader<In, Out> = this;
    while (!curr.pure) curr = curr.step(env);
    return curr.run(env);
  }
}

export const lift2 =
  <a, b, c>(f: (a: a, b: b) => c) =>
  <r>(fa: FreeReader<r, a>, fb: FreeReader<r, b>): FreeReader<r, c> =>
    fa.ap(fb.map(b => a => f(a, b)));
