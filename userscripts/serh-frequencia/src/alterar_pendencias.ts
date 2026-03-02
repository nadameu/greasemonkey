import { CustomError } from './CustomError';

export function alterar_pendencias(pendencias: HTMLElement) {
  const texto = pendencias.textContent.trim();
  const m = texto.match(
    /^(?<intro>Análise de pendências \(de \d{2}\/\d{4} a \d{2}\/\d{4}\): )(?<resultado>nenhum pendência encontrada|existem pendências em \d{2}\/\d{4}(?:, \d{2}\/\d{4})*)$/
  )?.groups as { intro: string; resultado: string } | undefined;
  if (m === undefined) {
    throw new CustomError('Texto das pendências desconhecido', { texto });
  }
  pendencias.textContent = m.intro;
  const span = document.createElement('span');
  if (m.resultado !== 'nenhum pendência encontrada') {
    span.style.color = 'red';
  }
  span.textContent = m.resultado;
  pendencias.append(span);
}
