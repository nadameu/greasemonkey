import { inserir } from './paginas/inserir';
import * as RE from 'descriptive-regexp';

export async function main() {
  const loc = window.location.href;
  const acao = getAcao(loc);
  if (!acao) throw new Error(`URL desconhecida: <${loc}>.`);
  switch (acao) {
    case 'insercao':
      return inserir();
    default:
      throw new Error(`Ação desconhecida: ${acao}.`);
  }
}

function getAcao(url: string) {
  const match = url.match(
    RE.concat(
      'https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-',
      RE.capture(/\w+/),
      '.jsf'
    )
  );
  if (!match) return null;
  return match[1]!;
}
