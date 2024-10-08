import { GM_addStyle } from '$';
import css from './barra-superior.scss?inline';

export const barraSuperior = (url: URL): null => {
  if (url.pathname !== '/seeu/usuario/areaAtuacao.do') return null;
  GM_addStyle(css);
  return null;
};
