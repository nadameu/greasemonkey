function padrao(nome: string, valor: string) {
  let valorSalvo = localStorage.getItem(nome);
  if (valorSalvo === null) {
    valorSalvo = valor;
  }
  return valorSalvo;
}

function salvar(nome: string, valor: string) {
  localStorage.setItem(nome, valor);
}

export const PreferenciasUsuario = {
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
    return valorSalvo === 'S';
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
