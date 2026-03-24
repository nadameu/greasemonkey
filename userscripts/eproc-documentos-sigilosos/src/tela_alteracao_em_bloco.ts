import { GM_addStyle, GM_info } from '$';
import { CustomError } from './CustomError';

export function tela_alteracao_em_bloco() {
  document
    .querySelectorAll('input[type="checkbox"].infraCheckbox')
    .values()
    .filter(input => /^chkInfraItem\d+$/.test(input.id))
    .flatMap(input => {
      const next = input.nextSibling;
      if (next.nodeType === Node.TEXT_NODE) {
        return [{ input, texto: next.nodeValue.trim() }];
      } else {
        return [];
      }
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
      if (sigilo === -1) {
        throw new CustomError('Sigilo desconhecido.', { texto });
      }
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
