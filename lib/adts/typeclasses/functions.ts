import { arraySequence } from '../array/internal';
import { thrush } from '../function';
import {
  Applicative,
  Apply,
  FlatMap,
  Functor,
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
  <F extends Kind>(M: Of<F> & FlatMap<F>): Apply<F>['ap'] =>
  fa =>
  ff =>
    thrush(ff)(
      M.flatMap((f, _?) => thrush(fa)(M.flatMap((a, _?) => M.of(f(a)))))
    );

export const deriveLiftN =
  <F extends Kind>(M: Applicative<F>) =>
  <A extends unknown[], b>(f: (...args: A) => b) =>
  <e>(...fs: UnsequenceTuple<F, e, A>): OutType<F, e, b> => {
    return M.map<A, b>((x, _?) => f(...x))(arraySequence(M)(fs));
  };
