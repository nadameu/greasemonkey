// ==UserScript==
// @name        Preenchimento dados baixa
// @namespace   http://nadameu.com.br/baixa
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=baixa_arquivamento_processo_etapa_(1|3)&/
// @version     3
// @grant       none
// ==/UserScript==

/* eslint indent: ["error", 2] */

const FECHAR_APOS_BAIXAR = 'fecharJanelasAposBaixar';

const Buffer = function Buffer(maximo) {
  this.maximo = maximo;
};
Buffer.prototype = Object.assign(
  Object.create(Array.prototype),
  {
    maximo: 0,
    push(digito) {
      const comprimento = this.maximo.toString().length;
      Array.prototype.push.call(this, digito);
      let valor = parseInt(this.join(''));
      while (this.length > comprimento || valor > this.maximo) {
        this.splice(0, 1);
        valor = parseInt(this.join(''));
      }
      return isNaN(valor) ? null : valor;
    }
  }
);

const Elemento = function Elemento(id) {
  this.elemento = document.getElementById(id);
};
Elemento.prototype = {
  elemento: null,
  set selecionado(selecionado) {
    this.elemento.checked = selecionado;
  },
  set texto(texto) {
    this.elemento.insertAdjacentHTML('beforeBegin', `<span class="gmValor">${texto}</span>`);
  }
};

const Elementos = {
  fromIds(ids) {
    return ids
      .map(id => new Elemento(id))
      .filter(wrapper => wrapper.elemento !== null);
  }
};

const Link = function Link(key, value) {
  this.key = key;
  this.value = value;
};
Link.prototype = {
  key: null,
  next: null,
  value: null,
  analisarValor(valor) {
    let selecionado = (valor & this.key) === this.key;
    this.value.forEach(elemento => elemento.selecionado = selecionado);
    if (this.next)
      this.next.analisarValor(valor);
  }
};

const LinkedList = function LinkedList(marcadosPorPadrao) {
  const definicoes = [];
  for (let i = 1; i < arguments.length; i++) {
    definicoes.push(arguments[i]);
  }
  let elementosPadrao = Elementos.fromIds(marcadosPorPadrao);
  elementosPadrao.forEach(elemento => elemento.texto = '0');
  this.head = new Link(0, elementosPadrao);

  let previous = this.head;
  let i = 0;
  Elementos.fromIds(definicoes).forEach(elemento => {
    let key = 1 << i;
    elemento.texto = key.toString();
    let current = previous.next = new Link(key, [elemento]);
    previous = current;
    this.maximo = (key << 1) - 1;
    i++;
  });
};
LinkedList.prototype = {
  head: null,
  maximo: 0,
  set valor(valor) {
    if (this.head) {
      this.head.analisarValor(valor);
    }
  }
};

const alturaTela = document.body.clientHeight;
const tamanhoFonte = alturaTela / 3;
document.querySelector('head').insertAdjacentHTML('beforeend', `<style>
.gmLabel {
	border-color: #faa;
}
.gmLabel.gmChecked {
	background: #fdc;
}
#gmFechar {
	cursor: pointer;
}
.gmLabel label {
	cursor: pointer;
}
.gmValor {
	display: inline-block;
	width: 18px;
	height: 18px;
	line-height: 18px;
	color: #333;
	background: #cea;
	border-radius: 100%;
}
.gmResultado {
	opacity: 0;
	will-change: opacity;
	position: fixed;
	display: flex;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	padding: 15%;
	background: rgba(0,0,0,0.5);
	align-items: center;
	justify-content: center;
	text-align: center;
	font-size: ${tamanhoFonte}px;
	font-weight: bold;
	color: white;
}
</style>`);

const etapa = window.location.search.match(/^\?acao=baixa_arquivamento_processo_etapa_(1|3)&/)[1];
if (etapa === '1') {

  document.querySelector('#fldPendencias').insertAdjacentHTML('beforebegin', '<label class="btn btn-default gmLabel"><input id="gmFechar" type="checkbox">&nbsp;<label for="gmFechar">Fechar esta janela e a janela/aba do processo após baixar</label></label>');
  const fechar = document.querySelector('#gmFechar');
  const fecharLabel = document.querySelector('.gmLabel');
  const onFecharChange = function() {
    let selecionado = fechar.checked;
    localStorage.setItem(FECHAR_APOS_BAIXAR, selecionado ? 'S' : 'N');
    if (selecionado) {
      fecharLabel.classList.add('gmChecked');
    } else {
      fecharLabel.classList.remove('gmChecked');
    }
  };
  fechar.addEventListener('change', onFecharChange);
  if (localStorage.hasOwnProperty(FECHAR_APOS_BAIXAR)) {
    fechar.checked = localStorage.getItem(FECHAR_APOS_BAIXAR) === 'S';
    onFecharChange();
  }

  document.body.insertAdjacentHTML('beforeend', '<div class="gmResultado"></div>');
  const resultado = document.querySelector('.gmResultado');
  resultado.addEventListener('click', () => {
    resultado.style.display = 'none';
    resultado.style.opacity = '0';
  });
  resultado.aplicarTransformacao = function(...propriedades) {
    console.log(this);
    if (propriedades.length > 0) {
      let p = propriedades.splice(0, 1)[0];
      requestAnimationFrame(() => requestAnimationFrame(() => {
        this.style.transition = p.transition;
        this.style.opacity = p.opacity;
        this.aplicarTransformacao.apply(this, propriedades);
      }));
    }
  };
  resultado.mostrar = function(texto, tamanho = '') {
    const CARACTERES_POR_SEGUNDO = 20;
    const MILISSEGUNDOS_POR_CARACTERE = 1000 / CARACTERES_POR_SEGUNDO;
    const esperaMinima = texto.length * MILISSEGUNDOS_POR_CARACTERE;

    this.style.display = '';
    this.style.fontSize = tamanho;
    this.textContent = texto;
    this.aplicarTransformacao({
      transition: '1ms',
      opacity: '1'
    }, {
      transition: `500ms linear ${esperaMinima}ms`,
      opacity: '0'
    });
  };
  resultado.mostrarInstrucoes = function() {
    this.mostrar('Digite a soma das opções que deseja selecionar. Pressione ENTER para confirmar.', '32px');
  };

  const valores = new LinkedList(
    /*  0 */
    [
      'rdoItem0/1', // Já teve baixa definitiva - SIM
      'chkPendencias', // Li e certifico o acima informado
      'rdoItem1/3', // Condenação - Não se aplica
      'rdoItem2/3', // Honorários, custas - Não se aplica
      'rdoItem3/2' // Apensos LEF - Não
    ],
    /*  1 */
    'rdoItem1/1', // Condenação - Sim
    /*  2 */
    'rdoItem2/1', // Honorários, custas - Sim
    /*  4 */
    'rdoItem1/2', // Condenação - Não
    /*  8 */
    'rdoItem2/2', // Honorários, custas - Não
    /* 16 */
    'rdoItem3/1' // Apensos LEF - Sim
  );

  const buffer = new Buffer(valores.maximo);

  document.addEventListener('keypress', evt => {
    if (/^\d$/.test(evt.key)) {
      const valor = buffer.push(evt.key);
      resultado.mostrar(valor.toString());
      valores.valor = valor;
    } else if (evt.keyCode === 13) {
      const baixar = document.querySelector('#sbmBaixa');
      baixar.click();
    }
  });

  resultado.mostrarInstrucoes();

} else if (etapa === '3') {
  if (localStorage.hasOwnProperty(FECHAR_APOS_BAIXAR) && localStorage.getItem(FECHAR_APOS_BAIXAR) === 'S') {
    let abertos = window.opener.documentosAbertos;
    if (abertos) {
      for (let id in abertos) {
        let janela = abertos[id];
        if (janela && ! janela.closed) {
          janela.close();
        }
      }
    }
    window.opener.close();
    window.close();
  }
}
