import { h } from '@nadameu/create-element';

export function criar_icone_material(symbol: string, title?: string) {
  return h('i', { classList: ['material-icons'], title }, symbol);
}
