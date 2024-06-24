import { GM_info } from '$';
import { h } from '@nadameu/create-element';
import { adicionarEstilos } from './adicionarEstilos';

export async function main() {
  const barra = await queryOne('#divInfraBarraComandosSuperior');
  const tabela = await queryOne<HTMLTableElement>(
    'table[summary="Tabela de Entidade Assistencial."], table[summary="Tabela de Entidade Assistencial Inativas."]'
  );
  const linhas = Array.from(tabela.rows).slice(1);
  const info = await Promise.all(
    linhas.map(async (linha, index) => {
      if (linha.cells.length === 0) {
        throw new Error(`Linha sem células: ${index}.`);
      }
      const ultimaCelula = linha.cells[linha.cells.length - 1]!;
      const lupa = await queryOne<HTMLImageElement>(
        'img[src$="/lupa.gif"][onmouseover]',
        ultimaCelula
      );
      const partes = lupa
        .getAttribute('onmouseover')
        ?.match(
          /^return infraTooltipMostrar\('Cidade: (.+),Bairro: (.+),Endereço: (.+)','Endereço',400\);$/
        );
      if (!partes || partes.length !== 4)
        throw new Error(
          `Informações de endereço não encontradas: linha ${index}.`
        );
      return [partes[1]!, partes[2]!, index] as const;
    })
  );
  const cidades = new Map([['', new Map([['', new Set<number>()]])]]);
  for (const [cidade, bairro, linha] of info) {
    cidades.get('')!.get('')!.add(linha);
    if (!cidades.has(cidade)) {
      cidades.set(cidade, new Map([['', new Set()]]));
    }
    const bairros = cidades.get(cidade)!;
    bairros.get('')!.add(linha);
    if (!bairros.has(bairro)) {
      bairros.set(bairro, new Set());
    }
    bairros.get(bairro)!.add(linha);
  }
  const div = h('div', { className: `${GM_info.script.name}__div` });
  const selCidade = h(
    'select',
    {},
    ...[...cidades.keys()]
      .sort(sortIgnoreCase)
      .map(cidade =>
        h('option', { value: cidade }, cidade === '' ? 'TODAS' : cidade)
      )
  );
  selCidade.addEventListener('change', onCidadeChange);
  const optBairro = h('option');
  optBairro.value = '';
  optBairro.textContent = 'TODOS';
  const selBairro = h('select', { disabled: true }, optBairro);
  selBairro.addEventListener('change', onBairroChange);
  div.append('Cidade: ', selCidade, ' Bairro: ', selBairro);
  adicionarEstilos();
  barra.insertAdjacentElement('afterend', div);

  function onCidadeChange() {
    Array.from(selBairro.children)
      .slice(1)
      .forEach(opt => opt.remove());
    if (selCidade.value === '') {
      selBairro.disabled = true;
    } else {
      selBairro.disabled = false;
      for (const bairro of [...cidades.get(selCidade.value)!.keys()].sort(
        sortIgnoreCase
      )) {
        if (bairro === '') continue;
        selBairro.append(h('option', { value: bairro }, bairro));
      }
    }
    updateLinhas(selCidade.value, '');
  }

  function onBairroChange() {
    updateLinhas(selCidade.value, selBairro.value);
  }

  function updateLinhas(cidade: string, bairro: string) {
    const mostrar = cidades.get(cidade)!.get(bairro)!;
    linhas.forEach((linha, index) => {
      linha.hidden = !mostrar.has(index);
    });
  }
}

export function sortIgnoreCase(a: string, b: string) {
  if (a.toLowerCase() < b.toLowerCase()) return -1;
  if (a.toLowerCase() > b.toLowerCase()) return +1;
  return 0;
}

export function queryOne<T extends Element>(
  selector: string,
  context: ParentNode = document
): Promise<T> {
  const elts = context.querySelectorAll<T>(selector);
  if (elts.length !== 1)
    return Promise.reject(
      new Error(
        `Não foi possível encontrar um elemento único: \`${selector}\`.`
      )
    );
  return Promise.resolve(elts[0]!);
}
