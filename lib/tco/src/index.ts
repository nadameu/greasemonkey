type Recursive<a> = { done: true; value: a } | { done: false; next: () => Recursive<a> };
export class TCO<a> {
  constructor(private _representation: Recursive<a>) {}

  chain<b>(f: (_: a) => TCO<b>): TCO<b> {
    return new TCO({
      done: false,
      next: () => {
        const value = this.run();
        return f(value)._representation;
      },
    });
  }
  map<b>(f: (_: a) => b): TCO<b> {
    return this.chain(x => TCO.of(f(x)));
  }
  run() {
    let result = this._representation;
    while (!result.done) result = result.next();
    return result.value;
  }

  static of<a>(value: a): TCO<a> {
    return new TCO({ done: true, value });
  }
}
