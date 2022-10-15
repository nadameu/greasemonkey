type IMaybe<a> = [isJust: true, value: a] | [isJust: false];
let Nothing: Maybe<never>;
export class Maybe<a> {
  private constructor(private _info: IMaybe<a>) {}
  chain<b>(f: (_: a) => Maybe<b>): Maybe<b> {
    return this._info[0] ? f(this._info[1]) : (this as Maybe<unknown> as Maybe<b>);
  }
  map<b>(f: (_: a) => b): Maybe<b> {
    return this.chain(x => Maybe.of(f(x)));
  }
  safeMap<b>(f: (_: a) => b | null | undefined): Maybe<b> {
    return this.chain(x => Maybe.from(f(x)));
  }
  valueOr(defaultValue: a): a;
  valueOr<b>(defaultValue: b): a | b;
  valueOr<b>(defaultValue: b): a | b {
    return this.valueOrElse(() => defaultValue);
  }
  valueOrElse(f: () => a): a;
  valueOrElse<b>(f: () => b): a | b;
  valueOrElse<b>(f: () => b): a | b {
    return this._info[0] ? this._info[1] : f();
  }
  where<b extends a>(p: (x: a) => x is b): Maybe<b>;
  where(p: (_: a) => boolean): Maybe<a>;
  where(p: (_: a) => boolean): Maybe<a> {
    return this.safeMap(x => (p(x) ? x : null));
  }
  static from<a>(value: a | null | undefined): Maybe<a> {
    return new Maybe(value == null ? [false] : [true, value]);
  }
  static just<a>(value: a): Maybe<a> {
    return new Maybe([true, value]);
  }
  static nothing<a = never>(): Maybe<a> {
    if (!Nothing) Nothing = new Maybe([false]);
    return Nothing;
  }
  static of<a>(value: a): Maybe<a> {
    return Maybe.just(value);
  }
}
