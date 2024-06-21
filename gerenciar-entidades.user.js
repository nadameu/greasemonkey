// ==UserScript==
// @name        gerenciar-entidades
// @name:pt-BR  Gerenciar entidades
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=entidade_assistencial_listar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=entidade_assistencial_reativar&*
// @grant       GM_addStyle
// @version     1.0.0
// @author      nadameu
// @description Permite filtrar entidades assistenciais
// ==/UserScript==

async function main() {
  const barra = await queryOne('#divInfraBarraComandosSuperior');
  const tabela = await queryOne(
    'table[summary="Tabela de Entidade Assistencial."], table[summary="Tabela de Entidade Assistencial Inativas."]'
  );
  const linhas = Array.from(tabela.rows).slice(1);
  const info = await Promise.all(
    linhas.map(async (linha, index) => {
      if (linha.cells.length === 0)
        throw new Error(`Linha sem células: ${index}.`);
      const ultimaCelula = linha.cells[linha.cells.length - 1];
      const lupa = await queryOne(
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
      return [partes[1], partes[2], index];
    })
  );
  const cidades = new Map([['', new Map([['', new Set()]])]]);
  for (const [cidade, bairro, linha] of info) {
    if (!cidades.has(cidade)) {
      cidades.set(
        cidade,
        new Map([
          ['', new Set([linha])],
          [bairro, new Set([linha])],
        ])
      );
    } else {
      const bairros = cidades.get(cidade);
      bairros.get('').add(linha);
      if (!bairros.has(bairro)) {
        bairros.set(bairro, new Set([linha]));
      } else {
        bairros.get(bairro).add(linha);
      }
    }
    cidades.get('').get('').add(linha);
  }
  const div = document.createElement('div');
  div.className = `${GM_info.script.name}__div`;
  const selCidade = document.createElement('select');
  for (const cidade of [...cidades.keys()].sort(sortIgnoreCase)) {
    const optCidade = document.createElement('option');
    optCidade.value = cidade;
    optCidade.textContent = cidade === '' ? 'TODAS' : cidade;
    selCidade.append(optCidade);
  }
  selCidade.addEventListener('change', onCidadeChange);
  const selBairro = document.createElement('select');
  const optBairro = document.createElement('option');
  optBairro.value = '';
  optBairro.textContent = 'TODOS';
  selBairro.append(optBairro);
  selBairro.disabled = true;
  selBairro.addEventListener('change', onBairroChange);
  div.append('Cidade: ', selCidade, ' Bairro: ', selBairro);
  adicionarEstilos();
  barra.insertAdjacentElement('afterend', div);

  function onCidadeChange() {
    console.debug('cidade changed');
    Array.from(selBairro.children)
      .slice(1)
      .forEach(opt => opt.remove());
    if (selCidade.value === '') {
      selBairro.disabled = true;
    } else {
      selBairro.disabled = false;
      for (const bairro of [...cidades.get(selCidade.value).keys()].sort(
        sortIgnoreCase
      )) {
        if (bairro === '') continue;
        const optBairro = document.createElement('option');
        optBairro.value = bairro;
        optBairro.textContent = bairro;
        selBairro.append(optBairro);
      }
    }
    updateLinhas(selCidade.value, '');
  }

  function onBairroChange() {
    updateLinhas(selCidade.value, selBairro.value);
  }

  function updateLinhas(cidade, bairro) {
    const mostrar = cidades.get(cidade).get(bairro);
    linhas.forEach((linha, index) => {
      linha.hidden = !mostrar.has(index);
    });
  }
}

function queryOne(selector, context = document) {
  const elts = context.querySelectorAll(selector);
  if (elts.length !== 1)
    return Promise.reject(
      new Error(
        `Não foi possível encontrar um elemento único: \`${selector}\`.`
      )
    );
  return Promise.resolve(elts[0]);
}

function sortIgnoreCase(a, b) {
  if (a.toLowerCase() < b.toLowerCase()) return -1;
  if (a.toLowerCase() > b.toLowerCase()) return +1;
  return 0;
}

function adicionarEstilos() {
  GM_addStyle(`
.bootstrap-styles .${GM_info.script.name}__div {
  position: relative;
  background: hsl(333deg 35% 70%);
  display: inline-block;
  padding: 1em 2ch;
  border-radius: 4px;
}
    `);
}

main().catch(err => {
  console.group(GM_info.script.name);
  console.error(err);
  console.groupEnd();
});
