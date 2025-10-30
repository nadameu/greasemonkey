import { GM_info } from '$';
import { h } from '@nadameu/create-element';
import { adicionarEstilos } from './adicionarEstilos';
import { StringMap } from './StringMap';

export async function main() {
  const barra = await queryOne('#divInfraBarraComandosSuperior');
  const tabela = await queryOne<HTMLTableElement>(
    'table[summary="Tabela de Entidade Assistencial."], table[summary="Tabela de Entidade Assistencial Inativas."]'
  );
  const { caption, registros, captionNewContent, output } =
    await queryOne<HTMLTableCaptionElement>('caption', tabela).then(
      async caption => {
        const match = caption.textContent.match(
          /^Lista de Entidade Assistencial \((\d+) registros\):$/
        );
        if (match === null || match[1] === undefined) {
          throw new Error(
            'Conteúdo da legenda da tabela não corresponde ao esperado.'
          );
        }
        const registros = Number(match[1]);
        const output = h('output', {}, pluralizar(registros));
        return {
          caption,
          registros,
          captionNewContent: ['Lista de Entidade Assistencial (', output, '):'],
          output,
        };
      }
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
      return [
        partes[1]!
          .replace(/\/(PR|RS|SC)/, '')
          .replace(/  +/g, ' ')
          .trim(),
        partes[2]!
          .replace(/\/(PR|RS|SC)/, '')
          .replace(/  +/g, ' ')
          .trim(),
        index,
      ] as const;
    })
  );
  const cidades = new StringMap([
    ['', new StringMap([['', new Set<number>()]])],
  ]);
  for (const [cidade, bairro, linha] of info) {
    cidades.get('')!.get('')!.add(linha);
    if (!cidades.has(cidade)) {
      cidades.set(cidade, new StringMap([['', new Set()]]));
    }
    const bairros = cidades.get(cidade)!;
    bairros.get('')!.add(linha);
    if (!bairros.has(bairro)) {
      bairros.set(bairro, new Set());
    }
    bairros.get(bairro)!.add(linha);
  }
  const sortIgnoreCase = new Intl.Collator('pt-BR', {
    sensitivity: 'base',
  }).compare;
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
  const selBairro = h(
    'select',
    { disabled: true },
    h('option', { value: '' }, 'TODOS')
  );
  selBairro.addEventListener('change', onBairroChange);
  const div = h(
    'div',
    { className: `${GM_info.script.name}__div` },
    'Cidade: ',
    selCidade,
    ' Bairro: ',
    selBairro
  );
  adicionarEstilos();
  barra.insertAdjacentElement('afterend', div);

  caption.replaceChildren(...captionNewContent);

  updateLinhas('', '');

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
    const exibidas = linhas
      .map((linha, index): number => {
        const exibir = mostrar.has(index);
        linha.hidden = !exibir;
        return exibir ? 1 : 0;
      })
      .reduce((x, y) => x + y, 0);
    if (exibidas === registros) {
      output.textContent = pluralizar(registros);
    } else {
      output.textContent = `exibindo ${exibidas} de ${pluralizar(registros)}`;
    }
  }
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

function pluralizar(registros: number) {
  return `${registros} registro${registros <= 1 ? '' : 's'}`;
}
