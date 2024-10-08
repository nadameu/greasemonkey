import { Opaque } from '@nadameu/opaque';
import { assert } from '@nadameu/predicates';

const dominios = {
  '1': 'trf4',
  '2': 'jfrs',
  '3': 'jfsc',
  '4': 'jfpr',
} as Record<'1' | '2' | '3' | '4', Dominio>;

export type Dominio = Opaque<string, { Dominio: Dominio }>;

export function getDominio(doc: typeof document) {
  const value = doc.querySelector<HTMLInputElement>(
    'input[name="local"]:checked'
  )?.value;
  assert(
    !!value && isInDominios(value),
    'Não foi possível verificar o domínio.'
  );
  return dominios[value];
}

function isInDominios(key: string): key is keyof typeof dominios {
  return key in dominios;
}
