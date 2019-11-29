export type Resultado<a> = Ok<a> | Invalido<a>;

export interface Ok<a> {
  isValido: true;
  valor: a;
}
export function Ok<a>(valor: a): Ok<a> {
  return { isValido: true, valor };
}

export interface Invalido<a = never> {
  isValido: false;
  razoes: string[];
}
export function Invalido<a = never>(razoes: string[]): Invalido<a> {
  return { isValido: false, razoes };
}
