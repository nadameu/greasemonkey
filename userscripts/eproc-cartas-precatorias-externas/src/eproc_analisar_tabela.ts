import { GM_addStyle } from '$';
import { abrir_aba_pdpj } from './abrir_aba_pdpj';
import { log_erro } from './log_erro';

export function eproc_analisar_tabela(tabela: HTMLTableElement) {
  for (const linha of tabela.rows) {
    if (linha.cells.length <= 1) continue; // link para carregar mais relacionados
    const primeira_celula = linha.cells[0]!;
    if (primeira_celula.querySelector('a[href]') !== null) continue; // já possui link
    const texto = primeira_celula.textContent.trim();
    const match = texto.match(/^(\d{20})(?:\/[A-Z]{2})?$/) as
      | [string, string]
      | null;
    if (match === null) {
      throw new Error(`Formato de número de processo desconhecido: ${texto}.`);
    }
    const [, numero] = match;
    const [, seq, dv, ...resto] = numero!.match(
      /(.......)(..)(....)(.)(..)(....)/
    ) as [string, string, string, string, string, string, string];
    const numero_formatado = `${seq}-${dv}.${resto.join('.')}`;
    const link = document.createElement('a');
    link.href = 'javascript:';
    link.addEventListener('click', e => {
      e.preventDefault();
      abrir_aba_pdpj(numero).catch(log_erro);
    });
    link.textContent = texto.replace(numero, numero_formatado);
    const span = document.createElement('span');
    span.className = 'gm-pdpj';
    span.textContent = 'jus.br';
    primeira_celula.replaceChildren(link, ' ', span);
  }
  GM_addStyle(`
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
