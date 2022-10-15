import { Maybe } from './Maybe';
import { throwError } from './throwError';

const dominios = {
  '1': 'trf4',
  '2': 'jfrs',
  '3': 'jfsc',
  '4': 'jfpr',
} as const;

export const getDominio = async (doc: Document) =>
  Maybe.from(doc.querySelector<HTMLInputElement>('input[name="local"]:checked'))
    .map(x => x.value)
    .where((x): x is keyof typeof dominios => x in dominios)
    .map(x => dominios[x])
    .valueOrElse(() => throwError('Não foi possível verificar o domínio.'));
