import { GM_info } from '$';
import { arrayHasLength } from '@nadameu/predicates';
import { AFASTAMENTOS } from './AFASTAMENTOS';
import { CustomError } from './CustomError';
import { gerar_intervalo, Intervalo } from './gerar_intervalo';
import { parse_data } from './parse_data';
import { Mes } from './parse_mes';

export function alterar_tabela_validados(
  tabela: HTMLTableElement,
  mes_referencia: Mes
) {
  const ultimo_dia_do_mes = {
    ...mes_referencia,
    dia: new Date(mes_referencia.ano, mes_referencia.mes, 0).getDate(),
  };
  return Array.from(tabela.rows)
    .map((linha, r) => {
      if (!arrayHasLength(8)(linha.cells)) {
        throw new CustomError('Linha contém número de células inesperado.', {
          indice: r,
          linha,
        });
      }
      if (r === 0) {
        const celula = linha.cells[5];
        return () => {
          celula.colSpan = ultimo_dia_do_mes.dia;
        };
      }
      const inicio = parse_data(linha.cells[3].textContent.trim());
      const fim = parse_data(linha.cells[4].textContent.trim());
      if (
        inicio.ano !== mes_referencia.ano ||
        inicio.mes !== mes_referencia.mes ||
        fim.ano !== mes_referencia.ano ||
        fim.mes !== mes_referencia.mes
      ) {
        throw new CustomError(
          'Data inicial e/ou final não correspondem ao mês de referência.',
          { inicio, fim, mes_referencia }
        );
      }
      const intervalos_afastamento = ((): Array<
        Intervalo & { motivo: string }
      > => {
        const m = linha.cells[5].textContent.match(
          /\s*[^(]+ \(\d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4}\)/g
        );
        if (m === null) return [];
        return m.map(p => {
          const m1 = p.match(
            /\s*([^(]+?)\s*\((\d{2}\/\d{2}\/\d{4}) a (\d{2}\/\d{2}\/\d{4})\)/
          );
          if (m1 === null || !arrayHasLength(4)(m1)) {
            throw new CustomError('Intervalo de datas desconhecido.', {
              texto: p,
            });
          }
          const inicio = parse_data(m1[2]);
          const fim = parse_data(m1[3]);
          return {
            ...gerar_intervalo(mes_referencia, inicio, fim),
            motivo: m1[1],
          };
        });
      })();
      const intervalos_tele = (() => {
        const m = linha.cells[5].textContent.match(
          /Em teletrabalho ((?:em \d{2}\/\d{2}\/\d{4}|de \d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4})(?:, (?:em \d{2}\/\d{2}\/\d{4}|de \d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4}))*)/
        );
        if (m === null || !arrayHasLength(2)(m)) return [];
        return m[1].split(', ').map(p => {
          const m1 = p.match(/em (\d{2}\/\d{2}\/\d{4})/);
          if (m1 !== null && arrayHasLength(2)(m1)) {
            const dt = parse_data(m1[1]);
            return { de: dt, ate: dt };
          }

          const m2 = p.match(
            /de (\d{2}\/\d{2}\/\d{4}) a (\d{2}\/\d{2}\/\d{4})/
          );
          if (m2 === null || !arrayHasLength(3)(m2)) {
            throw new CustomError('Intervalo de datas desconhecido.', {
              texto: p,
            });
          }
          const inicio = parse_data(m2[1]);
          const fim = parse_data(m2[2]);
          return gerar_intervalo(mes_referencia, inicio, fim);
        });
      })();
      return () => {
        const linha_dia = document.createElement('tr');
        linha_dia.className = `gm-${GM_info.script.name}`;
        linha.insertAdjacentElement('afterend', linha_dia);
        const proxima_linha = document.createElement('tr');
        proxima_linha.className = `gm-${GM_info.script.name}`;
        linha_dia.insertAdjacentElement('afterend', proxima_linha);
        Array.from(linha.cells).forEach((celula, c) => {
          if (c === 5) {
            celula.colSpan = ultimo_dia_do_mes.dia;
            for (let d = 1; d <= ultimo_dia_do_mes.dia; d += 1) {
              const celula_dia = linha_dia.insertCell();
              celula_dia.textContent = String(d).padStart(2, '0');
              const celula = proxima_linha.insertCell();
              if (inicio.dia > d || d > fim.dia) {
                celula.textContent = '-';
                continue;
              }
              const is_tele =
                intervalos_tele.filter(
                  ({ de: { dia: de_dia }, ate: { dia: ate_dia } }) =>
                    de_dia <= d && d <= ate_dia
                ).length > 0;
              const afastamentos_dia = intervalos_afastamento.filter(
                ({ de: { dia: de_dia }, ate: { dia: ate_dia } }) =>
                  de_dia <= d && d <= ate_dia
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
                continue;
              }
              if (is_tele) {
                celula.textContent = 'T';
                celula.style.background = '#eef';
                celula.title = 'teletrabalho';
              } else if (afastamento_dia !== null) {
                if (afastamento_dia in AFASTAMENTOS) {
                  const info =
                    AFASTAMENTOS[afastamento_dia as keyof typeof AFASTAMENTOS];
                  celula.textContent = info.abrev;
                  celula.style.background = info.cor;
                  celula.title = info.descricao;
                } else {
                  celula.textContent = 'A';
                  celula.style.background = '#cfc';
                  celula.title = afastamento_dia;
                }
              } else if (
                new Date(
                  mes_referencia.ano,
                  mes_referencia.mes - 1,
                  d
                ).getDay() %
                  6 ===
                0
              ) {
                // Final de semana
                celula.style.background = '#ccc';
                celula.textContent = ' ';
              } else {
                celula.textContent = 'P';
              }
            }
          } else {
            celula.rowSpan = 3;
          }
        });
      };
    })
    .reduce(
      (prev, fn) => () => {
        prev();
        fn();
      },
      () => {}
    );
}
