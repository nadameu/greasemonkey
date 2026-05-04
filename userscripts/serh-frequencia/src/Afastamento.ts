import { Intervalo } from './datas';

export interface Afastamento extends Intervalo {
  motivo: string;
}
export function Afastamento(intervalo: Intervalo, motivo: string) {
  const afastamento = Intervalo(
    intervalo.primeiro,
    intervalo.ultimo
  ) as Afastamento;
  afastamento.motivo = motivo;
  return afastamento;
}

export interface TipoAfastamento {
  descricao: string;
  cor: string;
  abrev: string;
}

export const TIPOS_AFASTAMENTO = {
  AFS: { descricao: 'evento', cor: '#ccf', abrev: 'E' },
  CPL: { descricao: 'compensação de plantão', cor: '#ccf', abrev: 'C' },
  DOS: { descricao: 'doação de sangue', cor: '#ccf', abrev: 'C' },
  Férias: { descricao: 'férias', cor: '#cfc', abrev: 'F' },
  LG: { descricao: 'licença à gestante', cor: '#ffc', abrev: 'L' },
  LTPF: {
    descricao: 'licença para tratamento de pessoa da família',
    cor: '#ffc',
    abrev: 'L',
  },
  LTS: {
    descricao: 'licença para tratamento da própria saúde',
    cor: '#ffc',
    abrev: 'L',
  },
} satisfies Record<string, TipoAfastamento>;
