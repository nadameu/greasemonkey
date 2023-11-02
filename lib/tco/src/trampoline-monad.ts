export abstract class Trampoline<a> {
  flatMap<b>(f: (_: a) => Trampoline<b>): Trampoline<b> {
    return new FlatMap(this, f);
  }
  map<b>(f: (_: a) => b): Trampoline<b> {
    return this.flatMap(x => Trampoline.of(f(x)));
  }
  abstract resume(max?: number): Of<a> | Suspend<a>;
  static of<a>(value: a): Trampoline<a> {
    return new Of(value);
  }
  run(): a {
    const MAX_RECURSION = 1 << 15;
    let result = this.resume(MAX_RECURSION);
    while (!(result instanceof Of)) {
      result = result._run().resume(MAX_RECURSION);
    }
    return result._value;
  }
}
class Of<a> extends Trampoline<a> {
  constructor(public _value: a) {
    super();
  }
  resume(): Of<a> | Suspend<a> {
    return this;
  }
}
class Suspend<a> extends Trampoline<a> {
  constructor(public _run: () => Trampoline<a>) {
    super();
  }
  resume(max = 0): Suspend<a> | Of<a> {
    if (max > 0) return (this._run().resume as Function)(max - 1);
    return this;
  }
}
class FlatMap<a0, a> extends Trampoline<a> {
  constructor(
    public _fa: Trampoline<a0>,
    public _f: (_: a0) => Trampoline<a>
  ) {
    super();
  }
  flatMap<b>(g: (_: a) => Trampoline<b>): Trampoline<b> {
    const { _fa: fa0, _f: f } = this;
    return new FlatMap(fa0, a0 => f(a0).flatMap(a => new Suspend(() => g(a))));
  }
  resume(max = 0): Of<a> | Suspend<a> {
    const { _fa, _f: f } = this;
    const fa0 = _fa as TrampolineU<a0>;
    if (fa0 instanceof Of) return f(fa0._value).resume(max - 1);
    if (fa0 instanceof Suspend) return new Suspend(() => fa0._run().flatMap(f));
    const { _f: g, _fa: fb } = fa0;
    return new FlatMap(fb, b => g(b).flatMap(f)).resume(max - 1);
  }
}
type TrampolineU<a> = Of<a> | Suspend<a> | FlatMap<any, a>;

export const done = <a>(value: a) => Trampoline.of(value);
export const loop = <a>(run: () => Trampoline<a>): Trampoline<a> =>
  new Suspend(run);
export const zip = <a, b>(
  fa: Trampoline<a>,
  fb: Trampoline<b>
): Trampoline<[a, b]> => fa.flatMap(a => fb.map(b => [a, b]));
