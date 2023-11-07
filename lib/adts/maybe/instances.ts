import { Applicative, Apply, Functor, Monad } from '../typeclasses';
import { map, ap, of, flatMap } from './functions';
import { MaybeF } from './internal';

export const functorMaybe: Functor<MaybeF> = { map };
export const applyMaybe: Apply<MaybeF> = { map, ap };
export const applicativeMaybe: Applicative<MaybeF> = { map, ap, of };
export const monadMaybe: Monad<MaybeF> = { map, ap, of, flatMap };
