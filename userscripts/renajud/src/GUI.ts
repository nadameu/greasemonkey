import { PreferenciasUsuario } from './PreferenciasUsuario';
import * as Pagina from './Pagina';
import { obterPorId } from './obter';
import { assert, isNotNull } from '@nadameu/predicates';

const style = document.createElement('style');
style.innerHTML = /* css */ `
  @media print { #gm-formulario, .noprint { display: none; } }
  @media screen { #gm-impressao, .noscreen { display: none; } }
  #gm-formulario { background: hsl(333, 50%, 95.1%); box-sizing: border-box; margin-top: 2%; margin-left: 2%; padding: 10px 3%; width: 90%; font-size: 14px; color: #333; }
  #gm-entrada p { margin: 0 0 1em; color: inherit; font-size: 1em; }
  #gm-explicacao { font-size: 0.94em; color: #444; }
  #gm-explicacao h4 { font-size: 1.05em; font-weight: 600; }
  #gm-explicacao ul { list-style: square inside; }
  #gm-explicacao ul ul { list-style: disc inside; margin-left: 2ex; margin-top: 0.5em; }
  #gm-explicacao li { margin: 0 0 0.5em; color: inherit; font-size: 1em; }
  #gm-entrada textarea { font-family: monospace; }
  #gm-saida { font-family: monospace; }
  #gm-impressao table { page-break-inside: avoid; }
`;
document.getElementsByTagName('head')[0]!.appendChild(style);

const painel = obterPorId('panel-inserir-restricao');
painel.insertAdjacentHTML(
  'beforebegin',
  /* html */ `
<div id="gm-formulario">
  <div id="gm-entrada">
    <p>Cole aqui o resultado do botão &ldquo;Copiar para colar no Excel&rdquo;:</p>
    <textarea cols="80" rows="10" autofocus></textarea>
    <div id="gm-explicacao">
      <h4>Onde encontro este botão?</h4>
      <ul>
        <li>Nas configurações do <em>eproc</em>:
          <ul>
            <li>Habilite &ldquo;Exibir botão &lsquo;Copiar para colar no Excel&rsquo;&rdquo;;</li>
            <li>Desabilite &ldquo;Ocultar demais partes da capa do processo&rdquo;;</li>
          </ul>
        </li>
        <li>Na tela do processo, próximo ao botão &ldquo;Download completo&rdquo;, haverá um botão &ldquo;Copiar para colar no Excel&rdquo;.</li>
        <li>Após clicar, certifique-se de que a mensagem &ldquo;Dados copiados&rdquo; foi exibida.</li>
      </ul>
    </div>
  </div>
  <div id="gm-saida"></div>
</div>`
);
const alteracoesGreasemonkey = obterPorId('gm-formulario');

document.body.insertAdjacentHTML(
  'beforeend',
  /* html */ `<div id="gm-impressao"></div>`
);
const impressaoGreasemonkey =
  painel.parentNode!.querySelector<HTMLDivElement>('#gm-impressao')!;

const listeners: Array<(_: string) => void> = [];
const dadosProcesso = alteracoesGreasemonkey.querySelector('textarea')!;
dadosProcesso.addEventListener(
  'input',
  () => {
    listeners.forEach(fn => fn(dadosProcesso.value));
  },
  false
);

const logElement =
  alteracoesGreasemonkey.querySelector<HTMLDivElement>('#gm-saida')!;
const divEntrada =
  alteracoesGreasemonkey.querySelector<HTMLDivElement>('#gm-entrada')!;

export const GUI = {
  addOnDadosInputListener(fn: (numproc: string) => void) {
    console.debug('GUI.addOnDadosInputListener(fn)', fn);
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
        PreferenciasUsuario.preencherMagistrado = (
          evt.target as HTMLInputElement
        ).checked;
      },
      false
    );
  },
  definirRestricoesVeiculo(ord: number, restricoes: string[]) {
    console.debug(
      'GUI.definirRestricoeVeiculo(ord, restricoes)',
      ord,
      restricoes
    );
    const celulaRestricao = Pagina.obterCelulaRestricaoVeiculo(ord);
    celulaRestricao.innerHTML =
      '<div class="noscreen">' + celulaRestricao.innerHTML + '</div>\n';
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
  hideEntrada() {
    console.debug('GUI.hideEntrada()');
    divEntrada.style.display = 'none';
  },
  restaurarTabelaVeiculos(fragmento: DocumentFragment) {
    console.debug('GUI.restaurarTabelaVeiculos(fragmento)', fragmento);
    const tBody = obterPorId('form-incluir-restricao:lista-veiculo_data');
    tBody.insertBefore(fragmento, tBody.firstChild);
  },
  salvarTabelaVeiculos() {
    console.debug('GUI.salvarTabelaVeiculos()');
    const fragmento = document.createDocumentFragment();
    const linhas = [
      ...obterPorId('form-incluir-restricao:lista-veiculo_data').rows,
    ];
    linhas.forEach(linha => fragmento.appendChild(linha));
    return fragmento;
  },
  show() {
    console.debug('GUI.show()');
    alteracoesGreasemonkey.style.display = '';
  },
  showEntrada() {
    console.debug('GUI.showEntrada()');
    divEntrada.style.display = '';
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
