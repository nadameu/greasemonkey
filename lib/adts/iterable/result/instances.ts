import { Applicative, Apply, Functor, Monad } from '../../typeclasses';
import { ap, flatMap, map, of } from './functions';
import { IteratorResultF } from './internal';

export const functorIteratorResult: Functor<IteratorResultF> = { map };
export const applyIteratorResult: Apply<IteratorResultF> = { ap, map };
export const applicativeIteratorResult: Applicative<IteratorResultF> = {
  ap,
  map,
  of,
};
export const monadIteratorResult: Monad<IteratorResultF> = {
  ap,
  flatMap,
  map,
  of,
};
