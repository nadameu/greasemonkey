// ==UserScript==
// @name        eproc-borda-processo
// @name:pt-BR  eproc - borda do processo
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_selecionar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&*
// @grant       GM_addStyle
// @version     1.0.0
// @author      nadameu
// @description Acrescenta uma borda ao processo, com a mesma cor da capa.
// ==/UserScript==

class CustomError extends Error {
  constructor(message, payload) {
    super(message);
    this.payload = payload;
  }
}
CustomError.prototype.name = 'CustomError';

try_catch(main);

function main() {
  const capa = document.getElementById('fldCapa');
  if (capa === null) throw new Error('Capa do processo não encontrada.');
  const cor_fundo = window.getComputedStyle(capa).backgroundColor;

  const wrapper = document.getElementById('page-content-wrapper');
  if (wrapper === null) throw new Error('Área de conteúdo não encontrada.');

  const fora = 5;
  const espessura = 5;
  const espaco = 5;
  const cor_borda = '#0002';

  const gradiente = `${cor_fundo} 0px, ${cor_fundo} ${espessura}px, ${cor_borda} ${espessura + 1}px, #0001 ${espessura + 1}px, #0000 ${espessura + 5}px`;

  GM_addStyle(`
@media screen {
  .bootstrap-styles #divInfraAreaImprimir {
    margin-inline: ${fora - 15 - 1}px;
    padding-inline: ${espessura + espaco}px;
    background:
      linear-gradient(to right, ${gradiente}) left 0 no-repeat,
      linear-gradient(to left, ${gradiente}) right 0 no-repeat;
    border: 1px solid ${cor_borda};
    box-shadow: 0 2px 4px #0001;
  }
  .bootstrap-styles #fldCapa {
    margin-inline: ${0 - espaco}px;
    padding-inline: calc(1rem + ${espaco}px) !important;
    border: none;
    border-bottom: 1px solid ${cor_borda};
    box-shadow: 0px 6px 4px -4px #0001 !important;
  }
  .bootstrap-styles #divInfraAreaImprimir::after {
    display: block;
    height: ${espessura + 2}px;
    content: '';
    background: ${cor_fundo};
    margin-inline: ${0 - espaco}px;
    margin-top: ${espaco + 2}px;
    border-top: 1px solid ${cor_borda};
    box-shadow: 0 -4px 2px -2px #0001;
  }
  .bootstrap-styles legend {
    width: auto !important;
  }
  .bootstrap-styles .table-responsive {
    width: inherit !important;
  }
}
`);
}

function try_catch(fn) {
  try {
    fn();
  } catch(err) {
    console.group(`<${GM_info.script.name}>`);
    console.error(err);
    if (err instanceof CustomError) {
      console.debug(err.payload);
    }
    console.groupEnd();
  }
}
