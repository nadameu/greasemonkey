import { Opaque } from '@nadameu/opaque';
import { CustomError } from './CustomError';

export const enum DiaDaSemana {
  DOMINGO = 0,
  SEGUNDA = 1,
  TERCA = 2,
  QUARTA = 3,
  QUINTA = 4,
  SEXTA = 5,
  SABADO = 6,
}
export type Data = Opaque<
  {
    readonly dia: number;
    readonly mes: number;
    readonly ano: number;
    dia_da_semana(): DiaDaSemana;
  },
  { Data: Data }
>;
export function Data(ano: number, mes: number, dia: number) {
  const dt = new Date(ano, mes - 1, dia);
  if (isNaN(dt.getTime())) {
    throw new CustomError('Data inválida.', { dia, mes, ano });
  }
  return {
    get dia() {
      return dt.getDate();
    },
    dia_da_semana() {
      return dt.getDay();
    },
    get mes() {
      return dt.getMonth() + 1;
    },
    get ano() {
      return dt.getFullYear();
    },
  } as Data;
}
export type Intervalo = Opaque<
  {
    [Symbol.iterator](): Iterator<Data>;
    readonly primeiro: Data;
    readonly ultimo: Data;
  },
  { Intervalo: Intervalo }
>;
export function Intervalo(primeiro: Data, ultimo: Data) {
  if (!lte(primeiro, ultimo)) {
    throw new CustomError('Primeiro é maior que último.', {
      primeiro,
      ultimo,
    });
  }
  return {
    *[Symbol.iterator](): Iterator<Data> {
      for (
        let dt = primeiro;
        lte(dt, ultimo);
        dt = Data(dt.ano, dt.mes, dt.dia + 1)
      ) {
        yield dt;
      }
    },
    primeiro,
    ultimo,
  } as Intervalo;
}
export type Mes = Opaque<
  Intervalo & {
    mes: number;
    ano: number;
    toString(): string;
  },
  { Mes: Mes }
>;
export function Mes(ano: number, mes: number) {
  const primeiro = Data(ano, mes, 1);
  const ultimo = Data(ano, mes + 1, 0);
  const resultado = Intervalo(primeiro, ultimo) as Mes;
  resultado.mes = primeiro.mes;
  resultado.ano = primeiro.ano;
  resultado.toString = Mes.prototype.toString;
  return resultado;
}
Mes.prototype.toString = function toString(this: Mes) {
  return `${this.mes.toString().padStart(2, '0')}/${this.ano}`;
};

/** Extrai uma data no formato dd/mm/aaaa */
export function texto_para_data(texto: string): Data {
  const { dia, mes, ano } =
    texto.match(/^(?<dia>\d{2})\/(?<mes>\d{2})\/(?<ano>\d{4})$/)?.groups ?? {};
  if (dia === undefined || mes === undefined || ano === undefined) {
    throw new CustomError('Data desconhecida', { texto });
  }
  return Data(Number(ano), Number(mes), Number(dia));
}

/** Extrai um mês no formado mm/aaaa */
export function texto_para_mes(texto: string): Mes {
  const { mes, ano } =
    texto.match(/^(?<mes>\d{2})\/(?<ano>\d{4})$/)?.groups ?? {};
  if (mes === undefined || ano === undefined) {
    throw new CustomError('Mês desconhecido', { texto });
  }
  return Mes(Number(ano), Number(mes));
}

export function gerar_intervalo(
  mes_referencia: Mes,
  inicio: Data,
  fim: Data
): Intervalo {
  const resultado = obter_intersecao(Intervalo(inicio, fim), mes_referencia);
  if (resultado === null) {
    throw new CustomError('Intervalo não se encontra no mês de referência.', {
      mes_referencia,
      inicio,
      fim,
    });
  } else {
    return resultado;
  }
}

function lte(a: Data, b: Data) {
  return (
    a.ano < b.ano ||
    (a.ano === b.ano && (a.mes < b.mes || (a.mes === b.mes && a.dia <= b.dia)))
  );
}

export function obter_intersecao(a: Intervalo, b: Intervalo) {
  const maior_inicio = lte(a.primeiro, b.primeiro) ? b.primeiro : a.primeiro;
  const menor_final = lte(a.ultimo, b.ultimo) ? a.ultimo : b.ultimo;
  if (lte(maior_inicio, menor_final)) {
    return Intervalo(maior_inicio, menor_final);
  } else {
    return null;
  }
}

export function dia_no_intervalo(dia: Data, intervalo: Intervalo) {
  return lte(intervalo.primeiro, dia) && lte(dia, intervalo.ultimo);
}
