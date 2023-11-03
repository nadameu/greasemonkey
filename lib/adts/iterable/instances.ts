import { Applicative, Apply, Functor, Monad } from '../typeclasses';
import { ap, flatMap, map, of } from './functions';
import { IterableF } from './internal';

export const functorIterable: Functor<IterableF> = { map };
export const applyIterable: Apply<IterableF> = { ap, map };
export const applicativeIterable: Applicative<IterableF> = {
  ap,
  map,
  of,
};
export const monadIterable: Monad<IterableF> = {
  ap,
  flatMap,
  map,
  of,
};
