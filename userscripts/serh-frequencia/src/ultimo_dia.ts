import { Dia } from './parse_data';
import { Mes } from './parse_mes';

export function ultimo_dia(mes_referencia: Mes): Dia {
  return {
    ...mes_referencia,
    dia: new Date(mes_referencia.ano, mes_referencia.mes, 0).getDate(),
  };
}
