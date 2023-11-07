import { arraySequence } from '../array/internal';
import {
  Applicative,
  FlatMap,
  Functor,
  InType,
  Kind,
  Of,
  OutType,
  UnsequenceTuple,
} from './definitions';

export const deriveMap =
  <F extends Kind>(M: Of<F> & FlatMap<F>): Functor<F>['map'] =>
  f =>
    M.flatMap((...args) => M.of(f(...args)));

export const deriveAp =
  <F extends Kind>(M: Of<F> & FlatMap<F>) =>
  <e2, a>(fa: InType<F, e2, a>) =>
  <e, b>(ff: InType<F, e, (_: a) => b>): OutType<F, e2 | e, b> =>
    M.flatMap<(_: a) => b, b, e>((f, _?) =>
      M.flatMap<a, b, e>((a, _?) => M.of(f(a)))(fa)
    )(ff);

export const deriveLiftN =
  <F extends Kind>(M: Applicative<F>) =>
  <A extends unknown[], b>(f: (...args: A) => b) =>
  <e>(...fs: UnsequenceTuple<F, e, A>): OutType<F, e, b> => {
    return M.map<A, b>((x, _?) => f(...x))(arraySequence(M)(fs));
  };
