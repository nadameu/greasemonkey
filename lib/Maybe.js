export class Maybe {}

class Just extends Maybe {
  constructor(value) {
    super();
    this.value = value;
  }
  *[Symbol.iterator]() {
    yield this.value;
  }
  chain(f) {
    return f(this.value);
  }
  safeMap(f) {
    return this.map(f).chain(fromNullish);
  }
  map(f) {
    return new Just(f(this.value));
  }
  then(Just, _) {
    return Just(this.value);
  }
}
const Jp = Just.prototype;
Jp.isJust = true;
Jp.isNothing = false;
const createJust = value => new Just(value);
export { createJust as Just };

class Nothing extends Maybe {
  *[Symbol.iterator]() {}
  then(_, Nothing) {
    return Nothing();
  }
}
const Np = Nothing.prototype;
Np.isJust = false;
Np.isNothing = true;
Np.chain = Np.safeMap = Np.map = () => nothing;
const nothing = new Nothing();
export { nothing as Nothing };

export const all = (...maybes) => {
  const results = [];
  for (const maybe of maybes) {
    if (maybe.isNothing) return nothing;
    results.push(maybe.value);
  }
  return new Just(results);
};

export const fromNullish = value => (value == null ? nothing : new Just(value));
