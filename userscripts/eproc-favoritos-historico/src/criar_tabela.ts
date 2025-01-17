import { h } from '@nadameu/create-element';

export function criar_tabela(
  cabecalhos: Array<Node | string>,
  linhas: Array<Array<Node | string>>
) {
  return h(
    'table',
    {},
    h('thead', {}, h('tr', {}, ...cabecalhos.map(child => h('th', {}, child)))),
    h(
      'tbody',
      {},
      ...linhas.map(celulas =>
        h('tr', {}, ...celulas.map(conteudo => h('td', {}, conteudo)))
      )
    )
  );
}
