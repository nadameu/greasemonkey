import { CustomError } from './CustomError';
import classes from './main.module.css';

export function main() {
  document.body.classList.add(classes['erro']);
  const input = document.getElementById('hdnNumDocumentos');
  if (!(input instanceof HTMLInputElement)) {
    throw new CustomError('Número de documentos não identificado.');
  }
  const valor = input.value;
  const qtd = Number(valor);
  if (isNaN(qtd)) {
    throw new CustomError('Valor não é um número.', { valor });
  }
  document.body.classList.remove(classes['erro']);
  if (qtd > 0) {
    document.body.classList.add(classes['continha-documentos-ao-carregar']);
  }
}
