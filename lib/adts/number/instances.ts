import { Monoid } from '../typeclasses/definitions';

export const monoidSum: Monoid<number> = { empty: () => 0, concat: (x, y) => x + y };
