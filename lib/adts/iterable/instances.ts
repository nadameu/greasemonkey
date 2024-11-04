import { Applicative, Apply, Functor, Monad } from '../typeclasses';
import { ap, flatMap, map, of } from './functions';
import { IterableF } from './internal';

export const functorIterable: Functor<IterableF> = { map };
export const applyIterable: Apply<IterableF> = { map, ap };
export const applicativeIterable: Applicative<IterableF> = { map, ap, of };
export const monadIterable: Monad<IterableF> = { map, ap, of, flatMap };
