import { GM_addStyle, GM_info } from '$';
import { alterar_pendencias } from './alterar_pendencias';
import { alterar_tabela_nao_validados } from './alterar_tabela_nao_validados';
import { alterar_tabela_validados } from './alterar_tabela_validados';
import { CustomError } from './CustomError';
import { texto_para_mes } from './datas';

export function main() {
  const pendencias = document.querySelector<HTMLElement>(
    '#lblPendenciasPassadasResultado'
  );
  if (pendencias !== null && pendencias.textContent.trim() !== '') {
    // Não haverá informação sobre pendências se usuário preencher "0" (zero) meses antes
    alterar_pendencias(pendencias);
  }

  const input_mes_ano =
    document.querySelector<HTMLInputElement>('input#txtMesAno');
  if (input_mes_ano === null) {
    throw new CustomError('Mês de referência não encontrado.');
  }
  const mes_referencia = texto_para_mes(input_mes_ano.value);

  document
    .querySelectorAll<HTMLTableElement>('.divTabelaValidacaoFrequencia table')
    .values()
    .map(tabela => {
      const caption = tabela.querySelector('caption')?.textContent ?? '';
      if (/Lista de Não Validados/.test(caption)) {
        return { validados: false, tabela };
      } else if (/Lista de Validados/.test(caption)) {
        return { validados: true, tabela };
      } else {
        throw new CustomError('Tabela desconhecida.', { tabela });
      }
    })
    .map(({ validados, tabela }) => {
      if (validados) {
        return alterar_tabela_validados(tabela, mes_referencia);
      } else {
        return alterar_tabela_nao_validados(tabela, mes_referencia);
      }
    })
    .toArray()
    .forEach(io => io.run());

  GM_addStyle(/* css */ `
tr.gm-${GM_info.script.name} > td {
  width: 2ch;
  text-align: center;
  vertical-align: middle;
}
`);
}
