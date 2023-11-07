import { S } from '../seq';
import { Applicative, Type, Kind, SequenceTuple } from '../typeclasses';

export const sequence: <F extends Kind>(
  M: Applicative<F>
) => <T extends Type<F, unknown, unknown>[]>(
  tuple: [...T]
) => SequenceTuple<F, T> = S.sequence as any;
