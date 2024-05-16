// ==UserScript==
// @name        projetos-assistenciais
// @name:pt-BR  Projetos assistenciais
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=entidade_assistencial_projeto_listar&*
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @version     1.0.0
// @author      nadameu
// @description Permite ordenar os projetos assistenciais por antiguidade
// ==/UserScript==

main().catch(err => {
  console.error(err);
});

async function main() {
  const barra = document.getElementById('divInfraBarraComandosSuperior');
  if (! barra) throw new Error(`Barra superior não encontrada.`);
  const button = h('button', { type: 'button', className: 'btn btn-sm gm-projetos-btn' }, 'Ordenar por antiguidade');
  const frag = document.createDocumentFragment();
  const currentYear = (new Date()).getFullYear()
  const anos = {
    start: { valid: true, value: GM_getValue('start', 1901) },
    end: { valid: true, value: GM_getValue('end', currentYear) }
  };
  const startInput = h('input', { maxLength: 4, size: 6, type: 'number', min: 1901, max: currentYear, value: anos.start.value, onChange: (_, elt) => save('start', elt) });
  const endInput = h('input', { maxLength: 4, size: 6, type: 'number', min: 1901, max: currentYear, value: anos.end.value, onChange: (_, elt) => save('end', elt) });
  frag.append(startInput,' \u00a0 ', endInput,' \u00a0 ', button, ' \u00a0 ')
  barra.insertBefore(frag, barra.firstChild);
  barra.addEventListener('click', onClick, false);
  adicionarEstilos();

  function save(varName, input) {
    const num = Number(input.value);
    if (isNaN(num) || num < 1901 || num > currentYear) {
      anos[varName] = { valid: false };
      return;
    }
    anos[varName] = { valid: true, value: num };
    GM_setValue(varName, num);
  }

  function onClick() {
    (async () => {
      const tbody = document.getElementById('tabela')?.tBodies[0];
      if (tbody === null) throw new Error(`Tabela não encontrada.`);
      const rows = Array.from(tbody.rows);
      const map = new WeakMap(rows.map(row => {
        const numproc = row.cells[3].textContent?.trim();
        const hash = `${numproc.substr(11, 4)}${numproc.slice(0,7)}`;
        return [row, hash];
      }));

      rows.sort((a, b) => {
        const na = map.get(a);
        const nb = map.get(b);
        if (na < nb) return -1;
        return 1;
      });
      let parity = 'odd';
      rows.forEach(row => {
        if (anos.start.valid && anos.end.valid) {
          const ano = Number(map.get(row).substr(0, 4));
          if (ano < anos.start.value || ano > anos.end.value) {
            row.remove();
            return;
          }
        }
        tbody.appendChild(row);
        let opposite = parity === 'odd' ? 'even' : 'odd';
        row.classList.remove(opposite);
        row.classList.add(parity);
        parity = opposite;
      });
    })().catch(err => {
      console.error(err);
    });
  }
}

function adicionarEstilos() {
  GM_addStyle(`
.bootstrap-styles .btn.btn-sm.gm-projetos-btn {
  background: hsl(333, 100%, 37.1%);
  color: #fff;
}
input:invalid {
  border: 2px solid red;
}
  `);
}

function h(tagName, props, ...children) {
  const elt = document.createElement(tagName);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (key.substr(0, 2) === 'on') {
      const eventName = key.substr(2).toLowerCase();
      elt.addEventListener(eventName, evt => value(evt, elt), false);
    } else {
      elt[key] = value;
    }
  }
  elt.append(...children);
  return elt;
}
