import { query } from './query';

export function getTabela() {
  return query<HTMLTableElement>('table#tabelaNomAJG');
}
