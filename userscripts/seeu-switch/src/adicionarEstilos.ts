import { h } from '@nadameu/create-element';
import css from './estilos.scss?inline';

const STYLE_ID = 'gm-seeu-switch-style';
export function adicionarEstilos() {
  const style =
    document.getElementById(STYLE_ID) ??
    document.head.appendChild(h('style', { id: STYLE_ID }));
  style.textContent = css;
}
