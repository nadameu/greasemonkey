import { PreferenciasUsuario } from './PreferenciasUsuario';
import * as Pagina from './Pagina';
import { obterPorId } from './obter';
import { assert, isNotNull } from '@nadameu/predicates';

const style = document.createElement('style');
style.innerHTML = /* css */ `
  @media print { div#alteracoesGreasemonkey, .noprint { display: none; } }
  @media screen { div#impressaoGreasemonkey, .noscreen { display: none; } }
  div#alteracoesGreasemonkey div { font-family: monospace; }
  div#impressaoGreasemonkey table { page-break-inside: avoid; }
`;
document.getElementsByTagName('head')[0]!.appendChild(style);

const painel = obterPorId('panel-inserir-restricao');
painel.insertAdjacentHTML(
  'beforebegin',
  /* html */ `<div id="alteracoesGreasemonkey"><select></select> <input placeholder="Número do processo" size="25" maxlength="25" autofocus/><div></div></div>`
);
const alteracoesGreasemonkey = obterPorId('#alteracoesGreasemonkey');

document.body.insertAdjacentHTML('beforeend', /* html */ `<div id="impressaoGreasemonkey"></div>`);
const impressaoGreasemonkey =
  painel.parentNode!.querySelector<HTMLDivElement>('#impressaoGreasemonkey')!;

const estadoElement = alteracoesGreasemonkey.querySelector('select')!;
let estadoSalvo = PreferenciasUsuario.estado;
estadoElement.insertAdjacentHTML(
  'afterbegin',
  ['PR', 'RS', 'SC']
    .map(
      estado => '<option' + (estado === estadoSalvo ? ' selected' : '') + '>' + estado + '</option>'
    )
    .join('')
);
estadoElement.addEventListener(
  'change',
  e => {
    estadoSalvo = (e.target as HTMLSelectElement).value;
    PreferenciasUsuario.estado = estadoSalvo;
  },
  false
);

const listeners: Array<(_: string) => void> = [];
const numprocElement = alteracoesGreasemonkey.querySelector('input')!;
numprocElement.addEventListener(
  'change',
  () => {
    const numproc = GUI.numproc.replace(/\D+/g, '');
    GUI.numproc = numproc;
    listeners.forEach(fn => fn(numproc));
  },
  false
);

const logElement = alteracoesGreasemonkey.querySelector('div')!;

export const GUI = {
  get estado() {
    return estadoElement.value;
  },
  get numproc() {
    return numprocElement.value;
  },
  set numproc(val) {
    numprocElement.value = val;
  },
  addOnNumprocChangeListener(fn: (numproc: string) => void) {
    console.debug('GUI.addOnNumprocChangeListener(fn)', fn);
    listeners.push(fn);
  },
  criarOpcaoPreencherMagistrado() {
    console.debug('GUI.criarOpcaoPreencherMagistrado()');
    const menu = obterPorId('form-incluir-restricao:campo-magistrado');
    const celula = menu.closest('td');
    assert(isNotNull(celula), `Não encontrado: campo magistrado.`);
    celula.insertAdjacentHTML(
      'afterend',
      /* html */ `<td><label><input type="checkbox" id="preencher-magistrado-automaticamente"/> Usar este valor como padrão para todos os processos</label></td>`
    );
    const checkbox = celula.parentNode!.querySelector<HTMLInputElement>(
      '[id="preencher-magistrado-automaticamente"]'
    )!;
    checkbox.checked = PreferenciasUsuario.preencherMagistrado;
    checkbox.addEventListener(
      'change',
      evt => {
        PreferenciasUsuario.preencherMagistrado = (evt.target as HTMLInputElement).checked;
      },
      false
    );
  },
  definirRestricoesVeiculo(ord: number, restricoes: string[]) {
    console.debug('GUI.definirRestricoeVeiculo(ord, restricoes)', ord, restricoes);
    const celulaRestricao = Pagina.obterCelulaRestricaoVeiculo(ord);
    celulaRestricao.innerHTML = '<div class="noscreen">' + celulaRestricao.innerHTML + '</div>\n';
    celulaRestricao.insertAdjacentHTML(
      'beforeend',
      restricoes.map(texto => `<div class="noprint">${texto}</div>`).join('\n')
    );
  },
  areaImpressao: {
    adicionar(elemento: HTMLElement) {
      console.debug('GUI.areaImpressao.adicionar(elemento)', elemento);
      impressaoGreasemonkey.appendChild(elemento);
    },
    limpar() {
      console.debug('GUI.areaImpressao.limpar()');
      impressaoGreasemonkey.innerHTML = '';
    },
  },
  hide() {
    console.debug('GUI.hide()');
    alteracoesGreasemonkey.style.display = 'none';
  },
  restaurarTabelaVeiculos(fragmento: DocumentFragment) {
    console.debug('GUI.restaurarTabelaVeiculos(fragmento)', fragmento);
    const tBody = obterPorId('form-incluir-restricao:lista-veiculo_data');
    tBody.insertBefore(fragmento, tBody.firstChild);
  },
  salvarTabelaVeiculos() {
    console.debug('GUI.salvarTabelaVeiculos()');
    const fragmento = document.createDocumentFragment();
    const linhas = [...obterPorId('form-incluir-restricao:lista-veiculo_data').rows];
    linhas.forEach(linha => fragmento.appendChild(linha));
    return fragmento;
  },
  show() {
    console.debug('GUI.show()');
    alteracoesGreasemonkey.style.display = '';
  },
  Logger: {
    clear() {
      console.debug('GUI.Logger.clear()');
      logElement.innerHTML = '';
    },
    write(text: string) {
      console.debug('GUI.Logger.write(text)', text);
      logElement.innerHTML += text.replace(/\n/g, '<br/>');
    },
  },
};
