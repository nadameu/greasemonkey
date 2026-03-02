export interface Afastamento {
  descricao: string;
  cor: string;
  abrev: string;
}

export const AFASTAMENTOS = {
  AFS: { descricao: 'evento', cor: '#ccf', abrev: 'E' },
  CPL: { descricao: 'compensação de plantão', cor: '#ccf', abrev: 'C' },
  Férias: { descricao: 'férias', cor: '#cfc', abrev: 'F' },
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
} satisfies Record<string, Afastamento>;
