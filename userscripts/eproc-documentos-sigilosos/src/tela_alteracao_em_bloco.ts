import { CustomError } from './CustomError';
import { parse_nivel_sigilo } from './parse_nivel_sigilo';
import classes from './tela_alteracao_em_bloco.module.scss';

export function tela_alteracao_em_bloco() {
  const dados = [
    ...document.querySelectorAll('input[type="checkbox"].infraCheckbox'),
  ]
    .filter(input => /^chkInfraItem\d+$/.test(input.id))
    .flatMap(input => {
      const text_node = input.nextSibling;
      if (text_node !== null && text_node.nodeType === Node.TEXT_NODE) {
        return [{ input, text_node, texto: text_node.nodeValue?.trim() ?? '' }];
      } else {
        return [];
      }
    })
    .map(({ input, texto, text_node }) => {
      const sigilo = parse_nivel_sigilo(texto);
      if (sigilo == null) {
        throw new CustomError('Sigilo desconhecido.', { texto });
      }
      return { sigilo, input, text_node };
    });

  for (const { sigilo, input, text_node } of dados) {
    const label = document.createElement('label');
    label.className = classes['gm']!;
    const span = document.createElement('span');
    span.className = classes[`gm-nivel${sigilo}`]!;
    span.append(text_node);
    input.replaceWith(label);
    label.append(input, ' ', span);
  }
}
