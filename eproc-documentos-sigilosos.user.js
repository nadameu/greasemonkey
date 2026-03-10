// ==UserScript==
// @name        eproc-documentos-sigilosos
// @name:pt-BR  eproc - documentos sigilosos
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=processo_documento_sigilo_listar&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_documento_sigilo_listar&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=processo_documento_sigilo_listar&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_documento_sigilo_listar&*
// @grant       GM_addStyle
// @version     1.0.0
// @author      nadameu
// @description Facilita a identificação de documentos sigilosos, de acordo com seu nível, na tela de alteração em bloco
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
  document.querySelectorAll('input[type="checkbox"].infraCheckbox').values()
  .filter(input => /^chkInfraItem\d+$/.test(input.id))
  .flatMap(input => {
    const next = input.nextSibling;
    if (next.nodeType === Node.TEXT_NODE) return [{ input, texto: next.nodeValue.trim() }];
    else return []
  })
  .map(({ input, texto }) => {
    const sigilo = (() => {
      if (/^Sem Sigilo \(Nível 0\)$/.test(texto)) return 0;
      if (/^Segredo de Justiça \(Nível 1\)$/.test(texto)) return 1;
      if (/^Restrito Juiz \(Nível 5\)$/.test(texto)) return 5;
      const match = texto.match(/^Sigiloso \(Interno Nível (2|3|4)\)$/);
      if (match !== null) return Number(match[1]);
      return -1;
    })();
    if (sigilo === -1) throw new CustomError('Sigilo desconhecido.', { texto });
    return { sigilo, input, texto };
  })
  .toArray() // necessário para verificar todos os erros antes de proceder a alterações
  .forEach(({ sigilo, input, texto }) => {
    const label = document.createElement('label');
    label.className = `gm-${GM_info.script.name} gm-${GM_info.script.name}-nivel${sigilo}`;
    const text_node = input.nextSibling;
    input.replaceWith(label);
    label.append(input, text_node);
  });
  GM_addStyle(`
.infra-styles .gm-${GM_info.script.name} {
  --uniform-spacing: 4px;
  --border-color: black;
  border: 1px solid transparent;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  padding-right: var(--uniform-spacing);
  border-radius: var(--uniform-spacing);
  font-size: 1em;
}
.infra-styles .gm-${GM_info.script.name}:has(input:checked) {
  opacity: 1;
  border-color: var(--border-color);
}
.infra-styles .gm-${GM_info.script.name} input {
  margin: var(--uniform-spacing);
}
.infra-styles .gm-${GM_info.script.name}-nivel0 {
  opacity: 0.5;
}
.infra-styles .gm-${GM_info.script.name}-nivel1,
.infra-styles .gm-${GM_info.script.name}-nivel2,
.infra-styles .gm-${GM_info.script.name}-nivel3,
.infra-styles .gm-${GM_info.script.name}-nivel4,
.infra-styles .gm-${GM_info.script.name}-nivel5 {
  color: #602;
  --border-color: #602;
}
.infra-styles .gm-${GM_info.script.name}-nivel2 {
  background: #ffd;
}
.infra-styles .gm-${GM_info.script.name}-nivel3,
.infra-styles .gm-${GM_info.script.name}-nivel4,
.infra-styles .gm-${GM_info.script.name}-nivel5 {
  background: #fda;
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
