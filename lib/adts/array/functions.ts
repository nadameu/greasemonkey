type Transform<a, b> = (xs: ArrayLike<a>) => b;

export const forEach = <a>(
  xs: ArrayLike<a>,
  f: (a: a, i: number) => void
): void => {
  for (let i = 0, len = xs.length; i < len; i++) f(xs[i]!, i);
};

export const foldLeft =
  <a, b>(seed: b, f: (acc: b, a: a, i: number) => b): Transform<a, b> =>
  xs => {
    let acc = seed;
    forEach(xs, (a, i) => {
      acc = f(acc, a, i);
    });
    return acc;
  };

const _foldLeftToNewArray =
  <a, b>(
    f: <c>(push: (_: b) => c, not: c) => (a: a, i: number) => c
  ): Transform<a, b[]> =>
  xs => {
    const result: b[] = [];
    const g = f(b => {
      result.push(b);
    }, undefined);
    forEach(xs, g);
    return result;
  };

export const foldRight =
  <a, b>(seed: b, f: (a: a, acc: b) => b): Transform<a, b> =>
  xs => {
    let acc = seed;
    for (let i = xs.length - 1; i >= 0; i--) acc = f(xs[i]!, acc);
    return acc;
  };

export const flatMap =
  <a, b>(f: (a: a, i: number) => ArrayLike<b>): Transform<a, b[]> =>
  xs => {
    const result: b[] = [];
    forEach(xs, (a, i) => {
      forEach(f(a, i), b => {
        result.push(b);
      });
    });
    return result;
  };
export const map = <a, b>(f: (a: a, i: number) => b): Transform<a, b[]> =>
  _foldLeftToNewArray(push => (a, i) => push(f(a, i)));

export const filter: {
  <a, b extends a>(pred: (a: a, i: number) => a is b): Transform<a, b[]>;
  <a>(pred: (a: a, i: number) => boolean): Transform<a, a[]>;
} = <a>(pred: (a: a, i: number) => boolean) =>
  _foldLeftToNewArray<a, a>(
    (push, not) => (a, i) => (pred(a, i) ? push(a) : not)
  );
