import { GM_addStyle } from '$';
import { h } from '@nadameu/create-element';
import { arrayHasLength, assert } from '@nadameu/predicates';
import { abrir_aba_pdpj } from './abrir_aba_pdpj';
import { log_erro } from './log_erro';
import { isNumProcFormatado, remover_formatacao } from './NumProc';

export function eproc_cartas() {
  const tabela = document.querySelector<HTMLTableElement>(
    '#divInfraAreaTabela > table.infraTable[summary="Tabela de Cartas Precatórias Externas."]'
  );
  assert(tabela != null, 'Erro ao obter tabela.');
  for (const [i, linha] of Array.from(tabela.rows).slice(1).entries()) {
    assert(
      arrayHasLength(14)(linha.cells),
      `Número de células esperado: 14. Obtido: ${linha.cells.length}. Linha: ${i}.`
    );
    const celula = linha.cells[0];
    const numero_formatado = celula.textContent.trim();
    if (numero_formatado === '') continue;
    if (!isNumProcFormatado(numero_formatado)) {
      celula.style.color = 'red';
      continue;
    }
    const numero = remover_formatacao(numero_formatado);
    const botao = h(
      'button',
      {
        type: 'button',
        className: 'gm-precatorias',
        onclick: e => {
          e.preventDefault();
          document
            .querySelector('button.gm-precatorias.gm-clicked')
            ?.classList.toggle('gm-clicked', false);
          botao.classList.add('gm-clicked');
          abrir_aba_pdpj(numero).catch(log_erro);
        },
      },
      'Consultar (jus.br)'
    );

    celula.append(document.createElement('br'), botao);
  }
  GM_addStyle(/* css */ `
.bootstrap-styles button.gm-precatorias {
  border: 1px outset hsl(333, 25%, 75%);
  border-radius: 4px;
  background: hsl(333, 25%, 50%);
  color: white;
  box-shadow: 0 2px 4px #0004;
  padding: 2px 8px;
}
.bootstrap-styles button.gm-precatorias.gm-clicked {
  box-shadow: 0 0 1px 2px yellow;
}
`);
}
