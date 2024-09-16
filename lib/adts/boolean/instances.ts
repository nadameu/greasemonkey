import { Monoid } from '../typeclasses/definitions';

export const monoidAnd: Monoid<boolean> = {
  empty: () => true,
  concat: (x, y) => x && y,
};

export const monoidOr: Monoid<boolean> = {
  empty: () => false,
  concat: (x, y) => x || y,
};
