import {
  Applicative,
  InType,
  Kind,
  OutType,
  SequenceTuple,
} from '../typeclasses';

export const arrayFoldLeft =
  <a, b>(seed: b, f: (acc: b, a: a, i: number) => b) =>
  (fa: ArrayLike<a>): b => {
    const len = fa.length;
    let acc = seed;
    for (let i = 0; i < len; i += 1) acc = f(acc, fa[i]!, i);
    return acc;
  };

const mutableAppend =
  <a>(xs: a[], _?: unknown) =>
  (x: a): a[] => {
    xs.push(x);
    return xs;
  };

export const arrayTraverse =
  <F extends Kind>(M: Applicative<F>) =>
  <a, b, e>(f: (a: a, i: number) => InType<F, e, b>) => {
    type Out<r> = OutType<F, e, r>;
    const mapToFn = M.map(mutableAppend<b>);
    const liftedAppend = (fbs: Out<b[]>, fb: Out<b>) => M.ap(fb)(mapToFn(fbs));
    return arrayFoldLeft<a, Out<b[]>>(M.of([]), (acc, a, i) =>
      liftedAppend(acc, f(a, i))
    );
  };

export const arraySequence = <F extends Kind>(
  M: Applicative<F>
): (<T extends InType<F, unknown, unknown>[]>(
  tfa: [...T]
) => SequenceTuple<F, T>) => arrayTraverse(M)(x => x) as any;

export interface ArrayF extends Kind {
  in: ArrayLike<this['a']>;
  out: Array<this['b']>;
  indexed: true;
}
