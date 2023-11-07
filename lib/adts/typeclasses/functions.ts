import { Apply, FlatMap, Functor, Kind, Of, Type } from './definitions';

const deriveMap =
  <F extends Kind>(M: Of<F> & FlatMap<F>): Functor<F>['map'] =>
  f =>
    M.flatMap(x => M.of(f(x)));
export { deriveMap as map };

const deriveAp =
  <F extends Kind>(M: Of<F> & FlatMap<F>) =>
  <e, a>(fa: Type<F, e, a>) =>
  <b>(ff: Type<F, e, (_: a) => b>): Type<F, e, b> =>
    M.flatMap<(_: a) => b, b, e>(f => M.flatMap<a, b, e>(a => M.of(f(a)))(fa))(
      ff
    );
export { deriveAp as ap };

const deriveLift2 =
  <F extends Kind>(M: Apply<F>) =>
  <a, b, c>(f: (a: a, b: b) => c) =>
  <e>(fa: Type<F, e, a>, fb: Type<F, e, b>): Type<F, e, c> =>
    M.ap(fb)(M.map((a: a) => (b: b) => f(a, b))(fa));
export { deriveLift2 as lift2 };
