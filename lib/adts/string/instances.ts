import { Monoid } from '../typeclasses';

export const monoidString: Monoid<string> = {
  empty: () => '',
  concat: (l, r) => `${l}${r}`,
};
