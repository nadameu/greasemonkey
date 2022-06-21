import { PreferenciasUsuario } from './PreferenciasUsuario';
import * as Pagina from './Pagina';

const style = document.createElement('style');
style.innerHTML = [
  '@media print { div#alteracoesGreasemonkey, .noprint { display: none; } }',
  '@media screen { div#impressaoGreasemonkey, .noscreen { display: none; } }',
  'div#alteracoesGreasemonkey div { font-family: monospace; }',
  'div#impressaoGreasemonkey table { page-break-inside: avoid; }',
].join('\n');
document.getElementsByTagName('head')[0].appendChild(style);

const painel = document.getElementById('panel-inserir-restricao');
painel.insertAdjacentHTML(
  'beforebegin',
  '<div id="alteracoesGreasemonkey"><select></select> <input placeholder="Número do processo" size="25" maxlength="25" autofocus/><div></div></div>'
);
const alteracoesGreasemonkey = document.getElementById('alteracoesGreasemonkey');

document.body.insertAdjacentHTML('beforeend', '<div id="impressaoGreasemonkey"></div>');
const impressaoGreasemonkey = document.getElementById('impressaoGreasemonkey');

const estadoElement = alteracoesGreasemonkey.querySelector('select');
const estadoSalvo = PreferenciasUsuario.estado;
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
  function (e) {
    estadoSalvo = e.target.value;
    PreferenciasUsuario.estado = estadoSalvo;
  },
  false
);

const listeners = [];
const numprocElement = alteracoesGreasemonkey.querySelector('input');
numprocElement.addEventListener(
  'change',
  function () {
    const numproc = GUI.numproc.replace(/\D+/g, '');
    GUI.numproc = numproc;
    listeners.forEach(fn => fn(numproc));
  },
  false
);

const logElement = alteracoesGreasemonkey.querySelector('div');

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
  addOnNumprocChangeListener(fn) {
    console.debug('GUI.addOnNumprocChangeListener(fn)', fn);
    listeners.push(fn);
  },
  criarOpcaoPreencherMagistrado() {
    console.debug('GUI.criarOpcaoPreencherMagistrado()');
    const menu = document.getElementById('form-incluir-restricao:campo-magistrado');
    const celula = menu.parentNode;
    while (celula && celula.tagName.toUpperCase() !== 'TD') {
      celula = celula.parentNode;
    }
    celula.insertAdjacentHTML(
      'afterend',
      '<td><label><input type="checkbox" id="preencher-magistrado-automaticamente"/> Usar este valor como padrão para todos os processos</label></td>'
    );
    const checkbox = document.getElementById('preencher-magistrado-automaticamente');
    checkbox.checked = PreferenciasUsuario.preencherMagistrado;
    checkbox.addEventListener(
      'change',
      function (evt) {
        PreferenciasUsuario.preencherMagistrado = evt.target.checked;
      },
      false
    );
  },
  definirRestricoesVeiculo(ord, restricoes) {
    console.debug('GUI.definirRestricoeVeiculo(ord, restricoes)', ord, restricoes);
    const celulaRestricao = Pagina.obterCelulaRestricaoVeiculo(ord);
    celulaRestricao.innerHTML = '<div class="noscreen">' + celulaRestricao.innerHTML + '</div>\n';
    celulaRestricao.insertAdjacentHTML(
      'beforeend',
      restricoes.map(texto => '<div class="noprint">' + texto + '</div>').join('\n')
    );
  },
  areaImpressao: {
    adicionar(elemento) {
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
  restaurarTabelaVeiculos(fragmento) {
    console.debug('GUI.restaurarTabelaVeiculos(fragmento)', fragmento);
    const tBody = document.getElementById('form-incluir-restricao:lista-veiculo_data');
    tBody.insertBefore(fragmento, tBody.firstChild);
  },
  salvarTabelaVeiculos() {
    console.debug('GUI.salvarTabelaVeiculos()');
    const fragmento = document.createDocumentFragment();
    const linhas = [...document.getElementById('form-incluir-restricao:lista-veiculo_data').rows];
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
    write(text) {
      console.debug('GUI.Logger.write(text)', text);
      logElement.innerHTML += text.replace(/\n/g, '<br/>');
    },
  },
};
