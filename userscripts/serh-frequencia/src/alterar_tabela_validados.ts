import { h } from '@nadameu/create-element';
import * as P from '@nadameu/predicates';
import { Afastamento, TIPOS_AFASTAMENTO } from './Afastamento';
import { CustomError } from './CustomError';
import {
  dia_no_intervalo,
  DiaDaSemana,
  gerar_intervalo,
  Intervalo,
  Mes,
  texto_para_data,
} from './datas';
import { IO } from './IO';

export function alterar_tabela_validados(
  tabela: HTMLTableElement,
  mes_referencia: Mes
) {
  const obter_intervalos_tele = make_obter_intervalos_tele(mes_referencia);
  const obter_intervalos_afastamento =
    make_obter_intervalos_afastamento(mes_referencia);
  return IO.sequence(
    ...Array.from(tabela.rows).map((linha, r) => {
      if (!P.arrayHasLength(8)(linha.cells)) {
        throw new CustomError('Linha contém número de células inesperado.', {
          indice: r,
          linha,
        });
      }
      if (r === 0) {
        const celula = linha.cells[6];
        return new IO(() => {
          for (const dia_atual of mes_referencia) {
            const celula_dia = h(
              'th',
              { className: 'infraTh' },
              dia_atual.dia.toString().padStart(2, '0')
            );
            linha.insertBefore(celula_dia, celula);
          }
          linha.deleteCell(5);
        });
      }
      const inicio = texto_para_data(linha.cells[3].textContent.trim());
      const fim = texto_para_data(linha.cells[4].textContent.trim());
      const intervalo_servidor = gerar_intervalo(mes_referencia, inicio, fim);
      const intervalos_afastamento = obter_intervalos_afastamento(
        linha.cells[5].textContent
      );
      const intervalos_tele = obter_intervalos_tele(linha.cells[5].textContent);
      return new IO(() => {
        Array.from(linha.cells).forEach((celula, c) => {
          if (c !== 5) {
            celula.rowSpan = 3;
            return;
          }
          celula.colSpan = mes_referencia.ultimo.dia;
          const linha_dia = h(
            'tr',
            {},
            ...Array.from(mes_referencia).map(({ dia }) =>
              h('td', {}, dia.toString().padStart(2, '0'))
            )
          );
          linha.insertAdjacentElement('afterend', linha_dia);
          const linha_eventos = h('tr');
          linha_dia.insertAdjacentElement('afterend', linha_eventos);
          for (const dia_atual of mes_referencia) {
            const celula = linha_eventos.insertCell();
            if (!dia_no_intervalo(dia_atual, intervalo_servidor)) {
              celula.textContent = '-';
              continue;
            }
            const is_tele =
              intervalos_tele.filter(intervalo =>
                dia_no_intervalo(dia_atual, intervalo)
              ).length > 0;
            const afastamentos_dia = intervalos_afastamento.filter(intervalo =>
              dia_no_intervalo(dia_atual, intervalo)
            );
            if (afastamentos_dia.length > 1) {
              throw new CustomError('Mais de um afastamento.', {
                afastamentos_dia,
              });
            }
            const afastamento_dia = afastamentos_dia[0]?.motivo ?? null;
            if (is_tele && afastamento_dia !== null) {
              celula.textContent = '?';
              celula.style.background = '#800';
              celula.style.color = 'white';
              celula.title = 'afastado(a), em teletrabalho';
            } else if (is_tele) {
              celula.textContent = 'T';
              celula.style.background = '#eef';
              celula.title = 'teletrabalho';
            } else if (afastamento_dia !== null) {
              if (afastamento_dia in TIPOS_AFASTAMENTO) {
                const info =
                  TIPOS_AFASTAMENTO[
                    afastamento_dia as keyof typeof TIPOS_AFASTAMENTO
                  ];
                celula.textContent = info.abrev;
                celula.style.background = info.cor;
                celula.title = info.descricao;
              } else {
                celula.textContent = 'A';
                celula.style.background = '#cfc';
                celula.title = afastamento_dia;
              }
            } else if (
              (d => d === DiaDaSemana.SABADO || d === DiaDaSemana.DOMINGO)(
                dia_atual.dia_da_semana()
              )
            ) {
              // Final de semana
              celula.style.background = '#ccc';
              celula.textContent = ' ';
            } else {
              celula.textContent = 'P';
            }
          }
        });
      });
    })
  );
}
function make_obter_intervalos_tele(mes_referencia: Mes) {
  return function obter_intervalos_tele(texto: string): Intervalo[] {
    const m = texto.match(
      /Em teletrabalho ((?:em \d{2}\/\d{2}\/\d{4}|de \d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4})(?:, (?:em \d{2}\/\d{2}\/\d{4}|de \d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4}))*)/
    );
    if (m === null || !P.arrayHasLength(2)(m)) return [];
    return m[1].split(', ').map(p => {
      const m1 = p.match(/em (\d{2}\/\d{2}\/\d{4})/);
      if (m1 !== null && P.arrayHasLength(2)(m1)) {
        const dt = texto_para_data(m1[1]);
        return Intervalo(dt, dt);
      }

      const m2 = p.match(/de (\d{2}\/\d{2}\/\d{4}) a (\d{2}\/\d{2}\/\d{4})/);
      if (m2 !== null && P.arrayHasLength(3)(m2)) {
        const inicio = texto_para_data(m2[1]);
        const fim = texto_para_data(m2[2]);
        return gerar_intervalo(mes_referencia, inicio, fim);
      } else {
        throw new CustomError('Intervalo de datas desconhecido.', {
          texto: p,
        });
      }
    });
  };
}

function make_obter_intervalos_afastamento(mes_referencia: Mes) {
  return function obter_intervalos_afastamento(texto: string): Afastamento[] {
    const m = texto.match(
      /\s*[^(]+ \(\d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4}\)/g
    );
    if (m === null) return [];
    return m.map(p => {
      const m1 = p.match(
        /\s*([^(]+?)\s*\((\d{2}\/\d{2}\/\d{4}) a (\d{2}\/\d{2}\/\d{4})\)/
      );
      if (m1 === null || !P.arrayHasLength(4)(m1)) {
        throw new CustomError('Intervalo de datas desconhecido.', {
          texto: p,
        });
      }
      const inicio = texto_para_data(m1[2]);
      const fim = texto_para_data(m1[3]);
      return Afastamento(gerar_intervalo(mes_referencia, inicio, fim), m1[1]);
    });
  };
}
