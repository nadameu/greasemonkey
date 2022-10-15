import { Maybe } from './Maybe';

const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;

export const siglaFromText = (text: string) =>
  Maybe.from(text.match(reSigla)).map(match => {
    if (match[2]) {
      // Possui sigla antiga e nova
      return match[1]!;
    } else {
      // Possui somente sigla nova
      return match[1]!.toLowerCase();
    }
  });
