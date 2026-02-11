import { GM_addStyle } from '$';
import { assert } from '@nadameu/predicates';
import { abrir_aba_pdpj } from './abrir_aba_pdpj';
import { log_erro } from './log_erro';

export function eproc_cartas() {
  const tabela = document
    .getElementById('divInfraAreaTabela')
    ?.querySelector<HTMLTableElement>(
      ':scope > table.infraTable[summary="Tabela de Cartas Precatórias Externas."]'
    );
  assert(tabela != null, 'Erro ao obter tabela.');
  for (const [i, linha] of Array.from(tabela.rows).slice(1).entries()) {
    assert(
      linha.cells.length === 14,
      `Número de células esperado: 14. Obtido: ${linha.cells.length}. Linha: ${i}.`
    );
    const celula = linha.cells[0]!;
    const numero_formatado = celula.textContent.trim();
    if (numero_formatado === '') continue;
    const numero = numero_formatado.replace(/[.-]/g, '');
    if (!/^[0-9]{20}$/.test(numero)) {
      celula.style.color = 'red';
      continue;
    }
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'gm-precatorias';
    botao.textContent = 'Consultar (jus.br)';
    botao.onclick = e => {
      e.preventDefault();
      document
        .querySelector('button.gm-precatorias.gm-clicked')
        ?.classList.toggle('gm-clicked', false);
      botao.classList.add('gm-clicked');
      abrir_aba_pdpj(numero).catch(log_erro);
    };
    celula.append(document.createElement('br'), botao);
  }
  GM_addStyle(`
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
