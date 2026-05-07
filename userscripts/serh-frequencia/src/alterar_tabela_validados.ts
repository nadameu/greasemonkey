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
import * as Par from './Par';

export function alterar_tabela_validados(
  tabela: HTMLTableElement,
  mes_referencia: Mes
) {
  const obter_intervalos = make_obter_intervalos(mes_referencia);
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
      const { afastamentos: intervalos_afastamento, tele: intervalos_tele } =
        obter_intervalos(linha.cells[5].textContent);
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
function make_obter_intervalos(mes_referencia: Mes) {
  const p_data = Par.map([Par.re(/\d{2}\/\d{2}\/\d{4}/)], texto_para_data);
  const p_em_data = Par.map([Par.right(Par.str('em '), p_data)], dt =>
    gerar_intervalo(mes_referencia, dt, dt)
  );
  const p_data_a_data = Par.map(
    [p_data, Par.str(' a '), p_data],
    (de, _, ate) => gerar_intervalo(mes_referencia, de, ate)
  );
  const p_de_data_a_data = Par.right(Par.str('de '), p_data_a_data);
  const p_intervalos_tele: Par.Parser<Intervalo[]> = Par.sep_by1(
    Par.choice(p_em_data, p_de_data_a_data),
    Par.str(', ')
  );
  const p_tele = Par.right(Par.str('Em teletrabalho '), p_intervalos_tele);
  const p_afastamento = Par.map(
    [
      Par.map([Par.take_until_p(Par.any(), Par.str(' ('))], x => x.join('')),
      Par.middle(Par.str(' ('), p_data_a_data, Par.str(')')),
    ],
    (motivo, intervalo) => Afastamento(intervalo, motivo)
  );
  const p_afastamentos: Par.Parser<Afastamento[]> = Par.sep_by1(
    p_afastamento,
    Par.str(' ')
  );

  const p_tudo = Par.choice(
    Par.right(
      Par.str(' '),
      Par.choice(
        Par.map(
          [
            p_afastamentos,
            Par.option(Par.right(Par.str(' - '), p_tele), () => []),
            Par.eof(),
          ],
          (afastamentos, tele) => ({ afastamentos, tele })
        ),
        Par.map([p_tele, Par.eof()], tele => ({
          afastamentos: [],
          tele,
        }))
      )
    ),
    Par.map([Par.eof()], () => ({ afastamentos: [], tele: [] }))
  );

  return function obter_intervalos(texto: string) {
    const r = p_tudo.match(texto, 0);
    if (!r.matched) throw new CustomError('Texto desconhecido.', { texto });
    return r.data;
  };
}
