// ==UserScript==
// @name        eproc-pesquisar-pessoa-bnmp
// @name:pt-BR  eproc - pesquisar pessoa no BNMP
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=bnmp/pessoa/consultar_dados&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=bnmp/pessoa/consultar_dados&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=bnmp/pessoa/consultar_dados&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=bnmp/pessoa/consultar_dados&*
// @grant       GM_addStyle
// @version     1.0.0
// @author      nadameu
// @description Na capa do processo, ao abrir a pesquisa sobre a situação da pessoa no BNMP, cria um link para pesquisar o CPF ou RJI naquele sistema
// ==/UserScript==

try {
  main();
} catch (err) {
  console.group('<eproc-pesquisar-pessoa-bnmp>');
  console.error(err);
  console.groupEnd();
}

function main() {
  const resultados = document
    .querySelectorAll('#divDadosPessoa > .row > [class^="col"]')
    .values()
    .map(div => ({
      div,
      match: /^(?<tipo>CPF|RJI): (?<numero>\d+)$/.exec(div.textContent.trim()),
    }))
    .filter(({ match }) => match !== null)
    .map(({ div, match }) => ({ div, ...match.groups }))
    .toArray();

  assert(
    resultados.length <= 2,
    'Não foi possível encontrar um resultado único.'
  );

  for (const { div, tipo, numero } of resultados) {
    div.insertAdjacentHTML(
      'beforeend',
      ` <span class="gm-eproc-pesquisar-pessoa-bnmp"><a href="${gerar_url(tipo, numero)}" target="_blank">Pesquisar no BNMP</a> (em nova aba)</span>`
    );
  }
  GM_addStyle(`
.bootstrap-styles .gm-eproc-pesquisar-pessoa-bnmp a[href] {
  display: inline-block;
  border-radius: 3px;
  padding-inline: 0.5ch;
  color: hsl(333 100% 25%);

  &:hover {
    background: hsl(333 50% 93%);
  }
}
`);
}

function gerar_url(tipo, numero) {
  switch (tipo) {
    case 'CPF':
      return `https://bnmp.pdpj.jus.br/pessoas/cpf/${numero}`;
    case 'RJI':
      return `https://bnmp.pdpj.jus.br/pessoas/rji/${numero}`;
    default:
      throw new Error(`Tipo desconhecido: "${tipo}".`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
