import { GM_addStyle } from '$';
import { h } from '@nadameu/create-element';
import {
  arrayHasAtLeastLength,
  arrayHasLength,
  assert,
  isNotNull,
} from '@nadameu/predicates';
import { abrir_aba_pdpj } from './abrir_aba_pdpj';
import { log_erro } from './log_erro';
import { formatar, isNumProc } from './NumProc';

export function eproc_analisar_tabela(tabela: HTMLTableElement) {
  for (const linha of tabela.rows) {
    if (!arrayHasAtLeastLength(2)(linha.cells)) continue; // link para carregar mais relacionados
    if (linha.cells[0].querySelector('a[href]') !== null) continue; // já possui link
    const texto = linha.cells[0].textContent.trim();
    const match = texto.match(/^(\d{20})(?:\/[A-Z]{2})?$/);
    assert(
      isNotNull(match) && arrayHasLength(2)(match) && isNumProc(match[1]),
      `Formato de número de processo desconhecido: ${texto}.`
    );
    const [, numero] = match;
    const link = h(
      'a',
      {
        href: 'javascript:',
        onclick: e => {
          e.preventDefault();
          abrir_aba_pdpj(numero).catch(log_erro);
        },
      },
      texto.replace(numero, formatar(numero))
    );
    const span = h('span', { className: 'gm-pdpj' }, 'jus.br');
    linha.cells[0].replaceChildren(link, ' ', span);
  }
  GM_addStyle(/* css */ `
.bootstrap-styles #divCapaProcesso span.gm-pdpj {
  display: inline-block;
  font-size: .67rem;
  font-weight: normal;
  border-radius: 4px;
  color: hsl(333, 50%, 30%);
  border: 1px solid;
  padding: 0 .5ch;
  line-height: 1.2em;
}
`);
}
