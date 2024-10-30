import { Applicative, Apply, Functor, Monad } from '../typeclasses';
import { ap, flatMap, map, of } from './functions';
import { SeqF } from './internal';

export const functorSeq: Functor<SeqF> = { map };
export const applySeq: Apply<SeqF> = { map, ap };
export const applicativeSeq: Applicative<SeqF> = { map, ap, of };
export const monadSeq: Monad<SeqF> = { map, ap, of, flatMap };
