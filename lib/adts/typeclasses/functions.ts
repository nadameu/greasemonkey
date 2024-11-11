import { flow } from '../function/flow';
import { Maybe } from '../maybe/definitions';
import {
  Apply,
  FilterableFunctor,
  FlatMap,
  Functor,
  Kind,
  Of,
  Type,
} from './definitions';
import { deriveMapN } from './mapN';
export { deriveMapN as mapN };

const deriveMap =
  <F extends Kind>(M: Of<F> & FlatMap<F>): Functor<F>['map'] =>
  f =>
    M.flatMap(x => M.of(f(x)));
export { deriveMap as map };

const deriveAp =
  <F extends Kind>(M: Of<F> & FlatMap<F>) =>
  <a, e2>(fa: Type<F, e2, a>) =>
  <b, e>(ff: Type<F, e, (_: a) => b>): Type<F, e | e2, b> =>
    M.flatMap<(_: a) => b, b, e>(f => M.flatMap<a, b, e>(a => M.of(f(a)))(fa))(
      ff
    );
export { deriveAp as ap };

const deriveLift2 =
  <F extends Kind>(M: Apply<F>) =>
  <a, b, c>(f: (a: a, b: b) => c) =>
  <e, e2>(fa: Type<F, e, a>, fb: Type<F, e2, b>): Type<F, e | e2, c> =>
    M.ap(fb)(M.map((a: a) => (b: b) => f(a, b))(fa));
export { deriveLift2 as lift2 };

const deriveFilterMap =
  <F extends Kind>(M: FilterableFunctor<F>) =>
  <a, b>(f: (a: a, i: number) => Maybe<b>) =>
  <e>(xs: Type<F, e, a>): Type<F, e, b> =>
    flow(
      xs,
      M.map(f),
      M.filter(m => m._tag === 'Just'),
      M.map(j => j.value)
    );
export { deriveFilterMap as filterMap };
