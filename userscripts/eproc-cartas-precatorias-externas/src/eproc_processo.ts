import { unsafeWindow } from '$';
import { eproc_analisar_tabela } from './eproc_analisar_tabela';
import { log_erro } from './log_erro';

export function eproc_processo() {
  const tabelas = document.querySelectorAll('#tableRelacionado');
  if (tabelas.length > 1)
    throw new Error(
      'Não foi possível obter tabela única de processos relacionados.'
    );
  if (tabelas.length === 0) return;
  const [tabela] = tabelas as unknown as [HTMLTableElement];
  const outros = tabela.querySelectorAll(
    '#carregarOutrosRelacionados > a[href^="javascript:"]'
  );
  if (outros.length > 1)
    throw new Error(
      'Não foi possível obter link único para carregamento de processos relacionados.'
    );
  if (outros.length === 1) {
    const $ = unsafeWindow.jQuery;
    $(document).on('ajaxComplete', function (_evt, _xhr, opts) {
      const params = new URL(opts.url, document.location.href).searchParams;
      if (params.get('acao_ajax') === 'carregar_processos_relacionados') {
        try {
          eproc_analisar_tabela(tabela);
        } catch (err) {
          log_erro(err);
        }
      }
    });
  }
  return eproc_analisar_tabela(tabela);
}
