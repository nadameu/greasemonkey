import { h } from '@nadameu/create-element';

export function criar_tabela<T extends string>(
  cabecalhos: Array<[T, Node | string]>,
  linhas: Iterable<Record<T, Node | string>>
) {
  const campos = cabecalhos.map(([nome]) => nome);
  return h(
    'table',
    null,
    h(
      'thead',
      null,
      h('tr', null, ...cabecalhos.map(([, child]) => h('th', null, child)))
    ),
    h(
      'tbody',
      null,
      ...Array.from(linhas, linha =>
        h('tr', null, ...campos.map(campo => h('td', null, linha[campo])))
      )
    )
  );
}
