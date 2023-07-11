import { h } from '@nadameu/create-element';
import css from './estilos.scss?inline';

export function adicionarEstilos() {
  document.head.appendChild(h('style', null, css));
}
