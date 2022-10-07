export var PreferenciasUsuario = (function () {
  function padrao(nome, valor) {
    let valorSalvo = localStorage.getItem(nome);
    if (valorSalvo === null) {
      valorSalvo = valor;
    }
    return valorSalvo;
  }

  function salvar(nome, valor) {
    localStorage.setItem(nome, valor);
  }

  var PreferenciasUsuario = {
    get estado() {
      return padrao('estado', 'PR');
    },
    set estado(valor) {
      salvar('estado', valor);
    },
    get magistrado() {
      return padrao('magistrado', '');
    },
    set magistrado(valor) {
      salvar('magistrado', valor);
    },
    get orgao() {
      return padrao('orgao', '');
    },
    set orgao(valor) {
      salvar('orgao', valor);
    },
    get preencherMagistrado() {
      let valorSalvo = localStorage.getItem('preencher-magistrado');
      if (valorSalvo === null || valorSalvo === 'N') {
        valorSalvo = false;
      } else {
        valorSalvo = true;
      }
      return valorSalvo;
    },
    set preencherMagistrado(valor) {
      salvar('preencher-magistrado', valor ? 'S' : 'N');
    },
    get municipio() {
      return padrao('municipio', '');
    },
    set municipio(valor) {
      salvar('municipio', valor);
    },
  };
  return PreferenciasUsuario;
})();
