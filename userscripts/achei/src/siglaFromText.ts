import { arrayHasLength, assert } from '@nadameu/predicates';

const reSigla = /^\s*Sigla:\s*(\S+)\s*(\(antiga:\s*\S+\s*\))?\s*$/;

export function siglaFromText(text: string) {
  const match = text.match(reSigla);
  if (!match) return null;
  assert(arrayHasLength(3)(match));
  if (match[2]) {
    // Possui sigla antiga e nova
    return match[1];
  } else {
    // Possui somente sigla nova
    return match[1].toLowerCase();
  }
}
