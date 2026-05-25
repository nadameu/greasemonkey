import { map_nullish } from './nullish';
import { parse_nivel_sigilo } from './parse_nivel_sigilo';
import classes from './tela_alteracao_em_bloco.module.scss';
export function tela_permissao_expressa() {
  const tabelas = [
    { summary: 'permissões', cells: 10, cell: 7 },
    { summary: 'Eventos', cells: 7, cell: 5 },
  ] satisfies { summary: string; cells: number; cell: number }[];
  const dados = tabelas.flatMap(({ summary, cells, cell }) =>
    [
      ...document.querySelectorAll<HTMLTableElement>(
        `table.infraTable[summary="${summary}"]`
      ),
    ]
      .map(t =>
        [...t.rows]
          .slice(1)
          .filter(r => r.cells.length === cells)
          .map(linha => ({ linha, celula: linha.cells[cell]! }))
          .map(({ linha, celula }) =>
            map_nullish(
              parse_nivel_sigilo(celula.textContent.trim()),
              sigilo => ({
                linha,
                celula,
                sigilo,
              })
            )
          )
      )
      .filter(t => t.every(not_null))
      .flat(1)
  );

  for (const { linha, celula, sigilo } of dados) {
    linha.dataset['gm_eproc_documentos_sigilosos'] = '';
    celula.classList.add(classes['gm']!);
    const span = document.createElement('span');
    span.className = classes[`gm-nivel${sigilo}`]!;
    span.append(...celula.childNodes);
    celula.append(span);
  }
}

export function not_null<T>(value: T | null): value is T {
  return value !== null;
}
