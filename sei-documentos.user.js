// ==UserScript==
// @name        sei-documentos
// @name:pt-BR  SEI! - Documentos
// @namespace   http://nadameu.com.br
// @match       https://sei.trf4.jus.br/controlador.php?acao=editor_montar&*
// @match       https://sei.trf4.jus.br/sei/controlador.php?acao=editor_montar&*
// @match       https://sei.trf4.jus.br/controlador.php?acao=documento_visualizar&*
// @match       https://sei.trf4.jus.br/sei/controlador.php?acao=documento_visualizar&*
// @grant       GM_addStyle
// @version     1.2.0
// @author      Paulo R. Maurici Jr.
// @description Limita a largura máxima dos documentos do SEI! para refletir a aparência do PDF correspondente
// ==/UserScript==

function main() {
  GM_addStyle(/* css */ `
  html {
    --largura-pdf: 18cm;
  }
  `);
  const url = new URL(document.location.href);
  switch (url.searchParams.get('acao')) {
    case 'editor_montar':
      GM_addStyle(/* css */ `
  .infra-editor__editor {
    width: calc(var(--largura-pdf) + 2 * 2em);
    max-width: 100%;
    margin-inline: auto;
  }
  `);
      break;

    case 'documento_visualizar':
      GM_addStyle(/* css */ `
  body {
    width: var(--largura-pdf);
    max-width: 100%;
    margin-inline: auto;
  }
    `);
      break;

    default:
      throw new Error(`Página desconhecida: ${document.location.href}.`);
  }
}

try {
  main();
} catch (e) {
  console.group('<SEI! - Documentos>');
  console.error(e);
  console.groupEnd();
}
