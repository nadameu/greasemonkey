import { Applicative, Apply, Functor, Monad } from '../typeclasses';
import { map, of, flatMap, ap } from './functions';
import { EitherF } from './internal';

export const functorEither: Functor<EitherF> = { map };
export const applyEither: Apply<EitherF> = { ap, map };
export const applicativeEither: Applicative<EitherF> = { ap, map, of };
export const monadEither: Monad<EitherF> = { map, ap, of, flatMap };
