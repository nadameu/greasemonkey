import {
  Applicative,
  Apply,
  Functor,
  Monad,
  MonoidK,
  SemigroupK,
} from '../typeclasses';
import { ap, concat, empty, flatMap, map, of } from './functions';
import { SeqF } from './internal';

export const functorSeq: Functor<SeqF> = { map };
export const applySeq: Apply<SeqF> = { map, ap };
export const applicativeSeq: Applicative<SeqF> = { map, ap, of };
export const monadSeq: Monad<SeqF> = { map, ap, of, flatMap };

export const semigroupSeq: SemigroupK<SeqF> = { concat };
export const monoidSeq: MonoidK<SeqF> = { concat, empty };
