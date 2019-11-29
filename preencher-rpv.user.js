// ==UserScript==
// @name        Preencher RPVs e precatórios
// @namespace   http://nadameu.com.br/preencher-rpv
// @description Auxilia no cálculo de honorários contratuais para preenchimento de RPVs e precatórios
// @include     http://sap.trf4.gov.br/requisicao/jf/frm_requisicao_jf.php
// @include     http://sap.trf4.gov.br/requisicao/jf/frm_requisicao_jf.php?num_requis=*
// @include     http://sap.trf4.gov.br/requisicao/jf/frm_requisicao_jf.php?acao=buscarDadosExecucao&num_proces_format=*
// @include     http://sap.trf4.gov.br/requisicao/jf/frm_beneficiario_jf.php?num_requis=*
// @include     http://sap.trf4.gov.br/requisicao/jf/frm_honorario_jf.php?num_requis=*
// @version     2
// @grant       none
// ==/UserScript==

const STEPS_HONORARIOS = 5;

const Moeda = (function() {
  const formatador = new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const validacao = /^-?\d{1,3}(?:(?:\.\d{3})*|\d*)(?:,\d+)?$/;
  return {
    formatar(valor) {
      return formatador.format(Math.round(valor * 100) / 100);
    },
    parse(texto) {
      if (!validacao.test(texto)) return NaN;
      const textoSemSeparadorMilhar = texto.replace(/\./g, '');
      return Math.round(parseFloat(`${textoSemSeparadorMilhar.replace(',', '.')}`) * 100) / 100;
    },
  };
})();

const Propriedades = (function() {
  const camposBoolean = ['haCorrente', 'haAnterior'];
  const camposInteiro = ['honorarios'];
  const camposMoeda = ['principal', 'total', 'corrente', 'anterior', 'sucumbencia', 'outros'];

  const valores = {};
  function definirValoresPadrao() {
    camposBoolean.forEach(campo => (valores[campo] = false));
    camposInteiro.forEach(campo => (valores[campo] = 0));
    camposMoeda.forEach(campo => (valores[campo] = 0));
  }
  definirValoresPadrao();
  let chaveSalvamento = null;

  const Propriedades = {
    definirChave(key) {
      chaveSalvamento = key;
    },
    restaurar(key) {
      if (typeof key !== 'undefined') Propriedades.definirChave(key);
      if (sessionStorage.hasOwnProperty(chaveSalvamento)) {
        Object.assign(valores, JSON.parse(sessionStorage.getItem(chaveSalvamento)));
        console.log(JSON.parse(sessionStorage.getItem(chaveSalvamento)));
      } else {
        definirValoresPadrao();
      }
    },
    salvar(key) {
      if (typeof key !== 'undefined') Propriedades.definirChave(key);
      if (chaveSalvamento) {
        sessionStorage.setItem(chaveSalvamento, JSON.stringify(valores));
      }
    },
  };

  const converterParaNumero = valor =>
    typeof valor === 'number' ? valor : Moeda.parse(valor.toString());
  camposBoolean.forEach(campo => {
    Object.defineProperty(Propriedades, campo, {
      enumerable: true,
      get: () => valores[campo],
      set: valor => (valores[campo] = !!valor),
    });
  });
  camposInteiro.forEach(campo => {
    Object.defineProperty(Propriedades, campo, {
      enumerable: true,
      get: () => valores[campo],
      set: valor => (valores[campo] = Math.round(converterParaNumero(valor))),
    });
  });
  camposMoeda.forEach(campo => {
    Object.defineProperty(Propriedades, campo, {
      enumerable: true,
      get: () => valores[campo] / 100,
      set: valor => (valores[campo] = Math.round(converterParaNumero(valor) * 100)),
    });
  });

  return Propriedades;
})();

function main() {
  const [script] = location.pathname.match(/^\/requisicao\/jf\/(.*)$/).slice(1);
  switch (script) {
    case 'frm_requisicao_jf.php':
      adicionarAlteracoesRequisicao();
      break;

    case 'frm_beneficiario_jf.php':
      adicionarAlteracoesBeneficiario();
      break;

    case 'frm_honorario_jf.php':
      adicionarAlteracoesHonorario();
      break;
  }
}

function adicionarAlteracoesBeneficiario() {
  adicionarAlteracoesComuns();
  const valorPrincipalComJuros = document.getElementById('divValorPrincipalComJuros');
  const resultado = criarResultadoAntesDe(valorPrincipalComJuros);
  atualizarResultadoBeneficiario().then(valoresCalculados => {
    criarBotaoApos(resultado, 'Usar valores calculados', evt => {
      evt.preventDefault();
      const principal = document.querySelector('[name="val_benefi"]');
      const juros = document.querySelector('[name="val_juros"]');
      const total = document.querySelector('[name="val_principal_com_juros"]');
      principal.value = Moeda.formatar(valoresCalculados.principalAutor);
      juros.value = Moeda.formatar(valoresCalculados.jurosAutor);
      total.value = Moeda.formatar(valoresCalculados.totalAutor);
      const deducao = document.querySelector('[name="sin_valor_deduca"]');
      const corrente = document.querySelector('[name="val_exerci_corren"]');
      const anterior = document.querySelector('[name="val_exerci_anteri"]');

      if (Propriedades.haCorrente || Propriedades.haAnterior) {
        deducao.value = 'S';
        corrente.value = Propriedades.haCorrente
          ? Moeda.formatar(valoresCalculados.correnteAutor)
          : '';
        anterior.value = Propriedades.haAnterior
          ? Moeda.formatar(valoresCalculados.anteriorAutor)
          : '';
      } else {
        deducao.value = 'N';
      }
      deducao.onchange();
    });
  });
}

function adicionarAlteracoesComuns() {
  adicionarEstilos();
  const numproc = document.querySelector('[name="num_regist_judici"]').value;
  Propriedades.restaurar(numproc);
}

function adicionarAlteracoesHonorario() {
  adicionarAlteracoesComuns();
  const valorPrincipalComJuros = document.getElementById('divValorPrincipalComJuros');
  const resultado = criarResultadoAntesDe(valorPrincipalComJuros);
  const tipo = document.querySelector('[name="tipo_honorario"]');

  let valoresCalculados;
  const botao = criarBotaoApos(resultado, 'Usar valores calculados', evt => {
    evt.preventDefault();
    const principal = document.querySelector('[name="val_honora"]');
    const juros = document.querySelector('[name="val_juros"]');
    const total = document.querySelector('[name="val_principal_com_juros"]');
    if (tipo.value === '2#O') {
      // Honorários de sucumbência
      principal.value = Moeda.formatar(Propriedades.sucumbencia);
      juros.value = Moeda.formatar(0);
      total.value = Moeda.formatar(Propriedades.sucumbencia);
    } else if (tipo.value === '53#O') {
      // Honorários contratuais
      principal.value = Moeda.formatar(valoresCalculados.principalAdvogado);
      juros.value = Moeda.formatar(valoresCalculados.jurosAdvogado);
      total.value = Moeda.formatar(valoresCalculados.totalAdvogado);
    } else {
      principal.value = Moeda.formatar(Propriedades.outros);
      juros.value = Moeda.formatar(0);
      total.value = Moeda.formatar(Propriedades.outros);
    }
  });
  botao.style.display = 'none';

  function onValoresAtualizados(valores) {
    valoresCalculados = valores;
    if (tipo.value !== '') {
      botao.style.display = '';
    }
  }
  function onValoresZerados() {
    botao.style.display = 'none';
  }
  function atualizarResultado() {
    return atualizarResultadoHonorario()
      .then(onValoresAtualizados)
      .catch(onValoresZerados);
  }

  atualizarResultado();

  tipo.addEventListener('change', () => {
    atualizarResultado();
  });
}

function adicionarAlteracoesRequisicao() {
  adicionarAlteracoesComuns();

  const labelTotal = document.getElementById('lblTotal');
  const div = document.createElement('div');
  div.className = 'gm-rpv__div';
  div.innerHTML = `
<label class="infraLabelOpcional" for="gm-rpv__principal">Valor principal corrigido: </label><input id="gm-rpv__principal" class="gm-rpv__principal" oninput="formatarCampoMoeda(this);" value="${Moeda.formatar(
    Propriedades.principal
  )}"><br>
<label class="infraLabelOpcional" for="gm-rpv__total">Valor total (principal + juros): </label><input id="gm-rpv__total" class="gm-rpv__total" oninput="formatarCampoMoeda(this);" value="${Moeda.formatar(
    Propriedades.total
  )}"><br>
<br>
<div class="gm-rpv__corrente__container"><input type="checkbox" id="gm-rpv__corrente"${
    Propriedades.haCorrente ? ' checked' : ''
  }><label class="infraLabelOpcional" for="gm-rpv__corrente">Exercício corrente - valor total (principal + juros): </label><input class="gm-rpv__corrente__valor" oninput="formatarCampoMoeda(this);" value="${Moeda.formatar(
    Propriedades.corrente
  )}"${Propriedades.haCorrente ? '' : ' disabled'}><br></div>
<input type="checkbox" id="gm-rpv__anterior"${
    Propriedades.haAnterior ? ' checked' : ''
  }><label class="infraLabelOpcional" for="gm-rpv__anterior">Exercício anterior - valor total (principal + juros): </label><input class="gm-rpv__anterior__valor" oninput="formatarCampoMoeda(this);" value="${Moeda.formatar(
    Propriedades.anterior
  )}"${Propriedades.haAnterior ? '' : ' disabled'}><br>
<br>
<label class="infraLabelOpcional" for="gm-rpv__honorarios-contratuais">Honorários contratuais: </label><input id="gm-rpv__honorarios-contratuais" class="gm-rpv__honorarios-contratuais" type="number" step="${STEPS_HONORARIOS}" value="${
    Propriedades.honorarios
  }" min="0" max="100"> %<br>
<br>
<label class="infraLabelOpcional" for="gm-rpv__honorarios-sucumbencia">Honorários de sucumbência: </label><input id="gm-rpv__honorarios-sucumbencia" class="gm-rpv__honorarios-sucumbencia" oninput="formatarCampoMoeda(this);" value="${Moeda.formatar(
    Propriedades.sucumbencia
  )}"><br>
<br>
<label class="infraLabelOpcional" for="gm-rpv__outros">Outros: </label><input id="gm-rpv__outros" class="gm-rpv__outros" oninput="formatarCampoMoeda(this);" value="${Moeda.formatar(
    Propriedades.outros
  )}"><br>
	`;
  labelTotal.parentElement.insertBefore(div, labelTotal);

  let valoresCalculados;
  function atualizarResultado() {
    return atualizarResultadoRequisicao()
      .then(valores => {
        valoresCalculados = valores;
        botao.style.display = '';
      })
      .catch(() => {
        botao.style.display = 'none';
      });
  }

  const tipo = document.getElementById('sin_precat_rpv');
  const containerCorrente = document.querySelector('.gm-rpv__corrente__container');
  const haCorrente = document.querySelector('#gm-rpv__corrente');
  const corrente = document.querySelector('.gm-rpv__corrente__valor');
  function verificarTipo() {
    if (tipo.value === 'R') {
      containerCorrente.style.display = '';
    } else {
      containerCorrente.style.display = 'none';
      Propriedades.haCorrente = false;
      haCorrente.checked = false;
      Propriedades.corrente = 0;
      corrente.value = '0,00';
      corrente.disabled = true;
      Propriedades.salvar();
    }
  }
  tipo.addEventListener('change', () => {
    verificarTipo();
    atualizarResultado();
  });
  verificarTipo();

  const resultado = criarResultadoAntesDe(div.nextSibling);

  const botao = criarBotaoApos(resultado, 'Usar valores calculados', evt => {
    evt.preventDefault();
    const total = document.querySelector('[name="val_total_requis"]');
    total.value = Moeda.formatar(valoresCalculados.totalRequisitado);
  });
  botao.insertAdjacentHTML('afterend', '<br>');

  atualizarResultado();

  const assoc = {
    principal: 'principal',
    total: 'total',
    corrente: 'corrente__valor',
    anterior: 'anterior__valor',
    honorarios: 'honorarios-contratuais',
    sucumbencia: 'honorarios-sucumbencia',
    outros: 'outros',
  };
  const elementos = {};
  function adicionarEventoInput(propriedade) {
    let seletor = `.gm-rpv__${assoc[propriedade]}`;
    let elemento = (elementos[propriedade] = document.querySelector(seletor));
    elemento.addEventListener('input', evt => {
      Propriedades[propriedade] = evt.target.value;
      atualizarResultado();
    });
    elemento.addEventListener('change', () => Propriedades.salvar());
  }
  for (let propriedade in assoc) {
    adicionarEventoInput(propriedade);
  }
  function adicionarEventoCheckbox(propriedadeVinculada) {
    const propriedade = `ha${propriedadeVinculada[0].toUpperCase()}${propriedadeVinculada.slice(
      1
    )}`;
    const elemento = (elementos[propriedade] = document.querySelector(
      `#gm-rpv__${propriedadeVinculada}`
    ));
    const elementoVinculado = elementos[propriedadeVinculada];
    elemento.addEventListener('change', () => {
      const checked = elemento.checked;
      Propriedades[propriedade] = checked;
      elementoVinculado.disabled = !checked;
      if (checked) {
        elementoVinculado.select();
        elementoVinculado.focus();
      } else {
        Propriedades[propriedadeVinculada] = 0;
        elementoVinculado.value = '0,00';
      }
      Propriedades.salvar();
      atualizarResultado();
    });
  }
  adicionarEventoCheckbox('corrente');
  adicionarEventoCheckbox('anterior');

  function atualizarESalvar(propriedade, valor, conversor = obj => obj.toString()) {
    Propriedades[propriedade] = valor;
    Propriedades.salvar();
    elementos[propriedade].value = conversor(valor);
    atualizarResultado();
  }
  elementos.principal.addEventListener('input', () => {
    Propriedades.principal = elementos.principal.value;
    if (elementos.total.getAttribute('value') === '0,00') {
      atualizarESalvar('total', Propriedades.principal, Moeda.formatar);
    }
  });
  function onEventoAtualizarAtributo(elemento, evento) {
    elemento.addEventListener(evento, () => elemento.setAttribute('value', elemento.value));
  }
  onEventoAtualizarAtributo(elementos.total, 'focus');
  onEventoAtualizarAtributo(elementos.total, 'change');

  function onEventoCalcularDiferenca(propriedade, propriedadeOposta) {
    const elemento = elementos[propriedade];
    elemento.addEventListener('focus', () => {
      if (Propriedades[propriedade] === 0) {
        atualizarESalvar(
          propriedade,
          arredondarMoeda(Propriedades.total - Propriedades[propriedadeOposta]),
          Moeda.formatar
        );
      }
    });
  }
  onEventoCalcularDiferenca('corrente', 'anterior');
  onEventoCalcularDiferenca('anterior', 'corrente');
}

function adicionarEstilos() {
  const style = document.createElement('style');
  style.innerHTML = `
input:disabled {
	color: #ccc;
	border-color: #ccc;
}
.gm-rpv__div, .gm-rpv__resultado {
	padding: 8px;
	margin-bottom: 1.3em;
}
.gm-rpv__div {
	background: #ffd;
	border: 2px solid #da7;
}
.gm-rpv__resultado {
	display: block;
	background: #dfd;
	border: 2px solid #ada;
	font-size: 1.1em;
}
.gm-rpv__resultado--erro {
	background: #fdd;
	border: 2px solid #d77;
	font-size: 1.1em;
}
.gm-rpv__botao-usar {
	margin-top: -1.3em;
	margin-bottom: 1.3em;
}
	`;
  document.querySelector('head').appendChild(style);
}

function arredondarMoeda(valor) {
  return Math.round(valor * 100) / 100;
}

function atualizarResultadoRequisicao(ocultarVazios = false) {
  return mostrarSeNaoHouverErros(valoresCalculados =>
    [
      gerarHTMLBeneficiario(valoresCalculados, ocultarVazios),
      gerarHTMLHonorarios(valoresCalculados, ocultarVazios),
      gerarHTMLSucumbencia(valoresCalculados, ocultarVazios),
      gerarHTMLOutros(valoresCalculados, ocultarVazios),
      gerarHTMLTotal(valoresCalculados, ocultarVazios),
    ]
      .filter(x => x !== '')
      .join('<br>')
  );
}

function atualizarResultadoBeneficiario() {
  return mostrarSeNaoHouverErros(valoresCalculados =>
    gerarHTMLBeneficiario(valoresCalculados, true)
  );
}

function atualizarResultadoHonorario() {
  return mostrarSeNaoHouverErros(valoresCalculados => {
    const honorarios = gerarHTMLHonorarios(valoresCalculados, true);
    const sucumbencia = gerarHTMLSucumbencia(valoresCalculados, true);
    const outros = gerarHTMLOutros(valoresCalculados, true);
    const resultados = [honorarios, sucumbencia, outros];
    const tipo = document.querySelector('[name="tipo_honorario"]');
    const valor = tipo.value;
    if (valor === '') {
      // Indefinido
      return resultados.filter(x => x !== '').join('<br>');
    }
    if (valor === '2#O') {
      // Honorários de sucumbência
      return sucumbencia;
    }
    if (valor === '53#O') {
      // Honorários contratuais
      return honorarios;
    }
    return outros;
  });
}

function calcularValores() {
  const {
    principal,
    total,
    haCorrente,
    corrente,
    haAnterior,
    anterior,
    honorarios,
    sucumbencia,
    outros,
  } = Propriedades;

  const erros = [];
  if (total < principal) {
    erros.push('Valor total não pode ser inferior ao principal.');
  }
  if (haCorrente && corrente > total) {
    erros.push('Valor do exercício corrente não pode ser superior ao total.');
  }
  if (haAnterior && anterior > total) {
    erros.push('Valor do exercício anterior não pode ser superior ao total.');
  }
  let somaIRPF = 0;
  if (haCorrente) somaIRPF += corrente;
  if (haAnterior) somaIRPF += anterior;
  if ((haCorrente || haAnterior) && arredondarMoeda(somaIRPF) !== total) {
    let inicio;
    if (haCorrente && haAnterior) {
      inicio = 'A soma dos exercícios corrente e anterior';
    } else {
      inicio = `O valor do exercício ${haCorrente ? 'corrente' : 'anterior'}`;
    }
    erros.push(
      `${inicio} (${Moeda.formatar(somaIRPF)}) não corresponde ao total (${Moeda.formatar(total)}).`
    );
  }
  if (erros.length > 0) {
    throw new Error(erros.join('\n'));
  }

  const principalAdvogado = arredondarMoeda((principal * honorarios) / 100);
  const totalAdvogado = arredondarMoeda((total * honorarios) / 100);
  const jurosAdvogado = arredondarMoeda(totalAdvogado - principalAdvogado);

  const principalAutor = arredondarMoeda(principal - principalAdvogado);
  const totalAutor = arredondarMoeda(total - totalAdvogado);
  const jurosAutor = arredondarMoeda(totalAutor - principalAutor);

  let correnteAutor, anteriorAutor;
  if (corrente < anterior) {
    correnteAutor = arredondarMoeda((corrente * (100 - honorarios)) / 100);
    anteriorAutor = arredondarMoeda(totalAutor - correnteAutor);
  } else {
    anteriorAutor = arredondarMoeda((anterior * (100 - honorarios)) / 100);
    correnteAutor = arredondarMoeda(totalAutor - anteriorAutor);
  }

  const totalRequisitado = arredondarMoeda(total + sucumbencia + outros);

  return {
    principalAutor,
    jurosAutor,
    totalAutor,
    correnteAutor,
    anteriorAutor,
    principalAdvogado,
    jurosAdvogado,
    totalAdvogado,
    totalRequisitado,
  };
}

function criarBotaoApos(elemento, texto, fn) {
  const botao = document.createElement('button');
  botao.className = 'gm-rpv__botao-usar';
  botao.textContent = texto;
  botao.addEventListener('click', fn);
  elemento.parentElement.insertBefore(botao, elemento.nextSibling);
  return botao;
}

function criarResultadoAntesDe(elemento) {
  const resultado = document.createElement('output');
  resultado.className = 'gm-rpv__resultado';
  elemento.parentElement.insertBefore(resultado, elemento);
  return resultado;
}

window.formatarCampoMoeda = function formatarCampoMoeda(input) {
  input.value = Moeda.formatar(Moeda.parse(input.value.replace(/\D/g, '')) / 100);
};

function gerarHTMLBeneficiario(valoresCalculados, ocultarVazios = false) {
  const { haCorrente, haAnterior } = Propriedades;
  const {
    principalAutor,
    jurosAutor,
    totalAutor,
    correnteAutor,
    anteriorAutor,
  } = valoresCalculados;
  if (ocultarVazios && totalAutor === 0) return '';
  let resultado = `Beneficiário: ${Moeda.formatar(totalAutor)} (${Moeda.formatar(
    principalAutor
  )} + ${Moeda.formatar(jurosAutor)})<br>`;
  if (haCorrente || haAnterior) {
    resultado += `
&nbsp;&nbsp;&nbsp;Exercício corrente: ${Moeda.formatar(correnteAutor)}<br>
&nbsp;&nbsp;&nbsp;Exercício anterior: ${Moeda.formatar(anteriorAutor)}<br>
		`;
  }
  return resultado;
}
function gerarHTMLHonorarios(valoresCalculados, ocultarVazios = false) {
  const { principalAdvogado, jurosAdvogado, totalAdvogado } = valoresCalculados;
  if (ocultarVazios && totalAdvogado === 0) return '';
  return `
Honorários contratuais: ${Moeda.formatar(totalAdvogado)} (${Moeda.formatar(
    principalAdvogado
  )} + ${Moeda.formatar(jurosAdvogado)})<br>
	`;
}
function gerarHTMLSucumbencia(valoresCalculados, ocultarVazios = false) {
  const { sucumbencia } = Propriedades;
  if (ocultarVazios && sucumbencia === 0) return '';
  return `
Honorários sucumbenciais: ${Moeda.formatar(sucumbencia)}<br>
	`;
}
function gerarHTMLOutros(valoresCalculados, ocultarVazios = false) {
  const { outros } = Propriedades;
  if (ocultarVazios && outros === 0) return '';
  return `
Outras verbas: ${Moeda.formatar(outros)}<br>
	`;
}
function gerarHTMLTotal(valoresCalculados, ocultarVazios = false) {
  const { totalRequisitado } = valoresCalculados;
  if (ocultarVazios && totalRequisitado === 0) return '';
  return `
Total requisitado: ${Moeda.formatar(totalRequisitado)}<br>
	`;
}

function mostrarSeNaoHouverErros(fn) {
  const resultado = document.querySelector('.gm-rpv__resultado');
  let valoresCalculados;
  try {
    valoresCalculados = calcularValores();
  } catch (err) {
    resultado.classList.add('gm-rpv__resultado--erro');
    resultado.innerHTML = err.message.split('\n').join('<br>');
    return Promise.reject(err.message);
  }
  resultado.classList.remove('gm-rpv__resultado--erro');
  const resposta = fn(valoresCalculados);
  if (resposta === '') {
    resultado.style.display = 'none';
    resultado.innerHTML = resposta;
    return Promise.reject('');
  }
  resultado.innerHTML = resposta;
  resultado.style.display = '';
  return Promise.resolve(valoresCalculados);
}

main();
