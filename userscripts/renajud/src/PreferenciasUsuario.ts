function padrao(nome: string, valor: string): string {
  let valorSalvo = localStorage.getItem(nome);
  if (valorSalvo === null) {
    valorSalvo = valor;
  }
  return valorSalvo;
}

function salvar(nome: string, valor: string) {
  localStorage.setItem(nome, valor);
}

export function getEstado() {
  return padrao('estado', 'PR');
}

export function setEstado(valor: string) {
  salvar('estado', valor);
}

export function getMagistrado() {
  return padrao('magistrado', '');
}

export function setMagistrado(valor: string) {
  salvar('magistrado', valor);
}

export function getOrgao() {
  return padrao('orgao', '');
}

export function setOrgao(valor: string) {
  salvar('orgao', valor);
}

export function getPreencherMagistrado(): boolean {
  return padrao('preencher-magistrado', 'N') === 'S';
}

export function setPreencherMagistrado(valor: boolean) {
  salvar('preencher-magistrado', valor ? 'S' : 'N');
}

export function getMunicipio() {
  return padrao('municipio', '');
}

export function setMunicipio(valor: string) {
  salvar('municipio', valor);
}
