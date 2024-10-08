import * as alteracoes from './alteracoes';

export const main = (): null => {
  const url = new URL(document.location.href);
  Object.values(alteracoes).forEach(f => f(url));
  return null;
};
