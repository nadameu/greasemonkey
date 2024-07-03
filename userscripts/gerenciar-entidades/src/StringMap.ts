const compare = new Intl.Collator('pt-BR', { sensitivity: 'base' }).compare;
export class StringMap<a> {
  private _internal = new Map<string, a>();
  constructor(values: Iterable<[string, a]> = []) {
    for (const [key, value] of values) {
      this.set(key, value);
    }
  }
  has<k extends string>(key: k) {
    for (const k of this._internal.keys()) {
      if (compare(key, k) === 0) return true;
    }
    return false;
  }
  set(key: string, value: a) {
    let found: false | [string] = false;
    for (const k of this._internal.keys()) {
      if (compare(key, k) === 0) {
        found = [k];
      }
    }
    if (found) {
      this._internal.delete(found[0]);
    }
    this._internal.set(key, value);
  }
  get(key: string) {
    for (const [k, v] of this._internal) {
      if (compare(key, k) === 0) {
        return v;
      }
    }
    return undefined;
  }
  keys() {
    return this._internal.keys();
  }
}
