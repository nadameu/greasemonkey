import { Kind, MonoidK, SemigroupK } from '../typeclasses';

interface ArrayF extends Kind {
  type: Array<this['a']>;
}

const concat = <a>(l: a[], r: a[]): a[] => l.concat(r);
const empty = <a = never>(): a[] => [];
export const semigroupArray: SemigroupK<ArrayF> = { concat };
export const monoidArray: MonoidK<ArrayF> = { concat, empty };
