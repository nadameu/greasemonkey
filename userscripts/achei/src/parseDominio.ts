import { Opaque } from '@nadameu/opaque';
import { askDocument, eitherBool, queryUnique, TaggedError } from './02_tools';

export class LocalDesconhecido extends TaggedError(
  'LocalDesconhecido'
)<string> {}

const dominios = {
  '1': 'trf4',
  '2': 'jfrs',
  '3': 'jfsc',
  '4': 'jfpr',
} as Record<'1' | '2' | '3' | '4', Dominio>;

export type Dominio = Opaque<string, { Dominio: Dominio }>;

export const parseDominio = askDocument
  .chain(queryUnique<HTMLInputElement>('input[name="local"]:checked'))
  .map(i => i.value)
  .chain(eitherBool(isInDominios, local => new LocalDesconhecido(local)))
  .map(d => dominios[d]);

function isInDominios(key: string): key is keyof typeof dominios {
  return key in dominios;
}
