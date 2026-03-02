import { CustomError } from './CustomError';

export interface Mes {
  mes: number;
  ano: number;
}

export function parse_mes(texto: string): Mes {
  const { mes, ano } =
    texto.match(/^(?<mes>\d{2})\/(?<ano>\d{4})$/)?.groups ?? {};
  if (mes === undefined || ano === undefined) {
    throw new CustomError('Mês desconhecido', { texto });
  }
  return { mes: Number(mes), ano: Number(ano) };
}
