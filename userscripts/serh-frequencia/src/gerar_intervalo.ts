import { CustomError } from './CustomError';
import { Dia } from './parse_data';
import { Mes } from './parse_mes';
import { ultimo_dia } from './ultimo_dia';

export interface Intervalo {
  de: Dia;
  ate: Dia;
}

export function gerar_intervalo(
  mes_referencia: Mes,
  inicio: Dia,
  fim: Dia
): Intervalo {
  const valor_mes_referencia = mes_referencia.ano * 12 + mes_referencia.mes;
  const valor_mes_inicio = inicio.ano * 12 + inicio.mes;
  const valor_mes_fim = fim.ano * 12 + fim.mes;
  if (
    valor_mes_fim < valor_mes_inicio ||
    (valor_mes_fim === valor_mes_inicio && fim.dia < inicio.dia)
  ) {
    throw new CustomError('Fim é menor que início.', { inicio, fim });
  }
  if (valor_mes_fim < valor_mes_referencia) {
    throw new CustomError('Fim é menor que o mês de referência.', {
      mes_referencia,
      fim,
    });
  }
  if (valor_mes_inicio < valor_mes_referencia) {
    if (valor_mes_fim === valor_mes_referencia) {
      return { de: { dia: 1, ...mes_referencia }, ate: fim };
    } else {
      return {
        de: { dia: 1, ...mes_referencia },
        ate: ultimo_dia(mes_referencia),
      };
    }
  } else if (valor_mes_inicio === valor_mes_referencia) {
    if (valor_mes_fim === valor_mes_referencia) {
      return { de: inicio, ate: fim };
    } else {
      return { de: inicio, ate: ultimo_dia(mes_referencia) };
    }
  } else {
    throw new CustomError('Início é maior que o mês de referência.', {
      mes_referencia,
      inicio,
    });
  }
}
