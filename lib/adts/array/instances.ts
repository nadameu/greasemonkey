import { MonoidK, SemigroupK } from '../typeclasses';
import { ArrayF } from './internal';

const concat = <a>(l: a[], r: a[]): a[] => l.concat(r);
const empty = <a = never>(): a[] => [];
export const semigroupArray: SemigroupK<ArrayF> = { concat };
export const monoidArray: MonoidK<ArrayF> = { concat, empty };
