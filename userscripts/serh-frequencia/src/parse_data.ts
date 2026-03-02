import { CustomError } from './CustomError';

export interface Dia {
  dia: number;
  mes: number;
  ano: number;
}

export function parse_data(texto: string): Dia {
  const { dia, mes, ano } =
    texto.match(/^(?<dia>\d{2})\/(?<mes>\d{2})\/(?<ano>\d{4})$/)?.groups ?? {};
  if (dia === undefined || mes === undefined || ano === undefined) {
    throw new CustomError('Data desconhecida', { texto });
  }
  return { dia: Number(dia), mes: Number(mes), ano: Number(ano) };
}
