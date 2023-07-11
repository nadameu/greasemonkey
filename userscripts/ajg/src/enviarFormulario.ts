import { buscarDocumento } from './buscarDocumento';

export async function enviarFormulario(
  url: string | URL,
  method?: string,
  data?: Document | XMLHttpRequestBodyInit | null
) {
  const doc = await buscarDocumento(url, method, data);
  const validacao = doc.getElementById('txaInfraValidacao');
  const excecoes = Array.from(doc.querySelectorAll('.infraExcecao'));
  const tabelaErros = doc.querySelector<HTMLTableElement>('table[summary="Erro(s)"]');
  if (validacao) {
    const match = validacao.textContent?.trim().match(/^Solicitação de pagamento (\d+) criada$/);
    if (match) {
      return match[1];
    }
  }
  const msgsErro = new Set(['Houve um erro ao tentar criar a solicitação!', '']);
  excecoes.forEach(excecao => msgsErro.add(excecao.textContent?.trim() ?? ''));
  if (tabelaErros) {
    const tBodyRows = Array.from(tabelaErros.rows).slice(1);
    tBodyRows
      .map(linha => linha.cells[1]?.textContent?.trim())
      .forEach(msg => msgsErro.add(msg ?? ''));
  }
  if (excecoes.length === 0 && !tabelaErros) {
    return false;
  }
  const msgErro = Array.from(msgsErro.values())
    .filter(x => x !== '')
    .join('\n');
  throw new ErroEnvioFormulario(msgErro, doc);
}

class ErroEnvioFormulario extends Error {
  document: Document;
  name = 'ErroEnvioFormulario';
  constructor(msg: string, public doc: Document) {
    super(msg);
    this.document = doc;
  }
}
