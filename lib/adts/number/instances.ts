import { Monoid } from '../typeclasses/definitions';

export const monoidSum: Monoid<number> = {
  empty: () => 0,
  concat: (x, y) => x + y,
};

export const monoidMin: Monoid<number> = {
  empty: () => Infinity,
  concat: (x, y) => (x > y ? y : x),
};

export const monoidMax: Monoid<number> = {
  empty: () => -Infinity,
  concat: (x, y) => (x < y ? y : x),
};
