import { Maybe } from './01_implementations';
import { maybe, maybeBool } from './02_tools';

const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;

declare const SiglaSymbol: unique symbol;
export type Sigla = string & { [SiglaSymbol]: Sigla };

export const parseSigla = (text: string): Maybe<Sigla> =>
  maybe(text.match(reSigla))
    .chain(maybeBool(<T>(xs: ArrayLike<T>): xs is [T, T, T] => xs.length === 3))
    .map(match => {
      if (match[2]) {
        // Possui sigla antiga e nova
        return match[1] as Sigla;
      } else {
        // Possui somente sigla nova
        return match[1].toLowerCase() as Sigla;
      }
    });
