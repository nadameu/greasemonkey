import { h } from '@nadameu/create-element';
import { CustomError } from './CustomError';

export function alterar_pendencias(pendencias: HTMLElement) {
  const texto = pendencias.textContent.trim();
  const { intro, resultado } =
    texto.match(
      /^(?<intro>Análise de pendências \(de \d{2}\/\d{4} a \d{2}\/\d{4}\): )(?<resultado>nenhum pendência encontrada|existem pendências em \d{2}\/\d{4}(?:, \d{2}\/\d{4})*)$/
    )?.groups ?? {};
  if (intro === undefined || resultado === undefined) {
    throw new CustomError('Texto das pendências desconhecido', { texto });
  }
  pendencias.textContent = intro;
  const span = h('span', {}, resultado);
  if (resultado !== 'nenhum pendência encontrada') {
    span.style.color = 'red';
  }
  pendencias.append(span);
}
