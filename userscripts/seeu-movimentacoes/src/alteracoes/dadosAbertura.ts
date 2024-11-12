import { GM_deleteValue, GM_getValue, GM_setValue } from '$';
import * as P from '@nadameu/predicates';
import * as Parametros from './parametros';

export type TipoAbertura = 'padrao' | 'janela';

export const isPosicao = /* #__PURE__ */ P.hasShape({
  top: P.isInteger,
  left: P.isInteger,
  width: P.isNonNegativeInteger,
  height: P.isNonNegativeInteger,
});
export interface Posicao extends P.Static<typeof isPosicao> {}
export const validarPosicao = (
  posicao: Record<keyof Posicao, number>
): Posicao =>
  P.check(
    isPosicao,
    posicao,
    `Posição inválida: \`${JSON.stringify(posicao)}\`.`
  );

export function posicaoToFeatures(posicao: Posicao): string {
  return Object.entries<number>(posicao)
    .map(([k, v]) => `${k}=${v.toString(10)}`)
    .join(',');
}
export function dadosAberturaToFeatures(
  dadosAbertura: DadosAbertura
): string | undefined {
  if (dadosAbertura.tipo === 'padrao') return undefined;
  else return posicaoToFeatures(dadosAbertura.posicao);
}

export type DadosAbertura =
  | { tipo: 'padrao' }
  | { tipo: 'janela'; posicao: Posicao };
export const DadosAbertura = {
  carregar(): DadosAbertura {
    const tipo = GM_getValue<unknown>(Parametros.TIPO_ABERTURA, 'padrao');
    if (tipo === 'padrao') return { tipo };
    if (tipo === 'janela') {
      const posicao = GM_getValue<unknown>(Parametros.PARAMETROS_JANELA, null);
      if (isPosicao(posicao)) return { tipo, posicao };
      /* else omitted */
    }
    DadosAbertura.salvar(null);
    return { tipo: 'padrao' };
  },
  salvar(dadosAbertura: DadosAbertura | null) {
    if (dadosAbertura?.tipo ?? 'padrao' === 'padrao') {
      GM_deleteValue(Parametros.PARAMETROS_JANELA);
    }
    if (dadosAbertura === null) {
      GM_deleteValue(Parametros.TIPO_ABERTURA);
    } else {
      GM_setValue(Parametros.TIPO_ABERTURA, dadosAbertura.tipo);
      if (dadosAbertura.tipo === 'janela') {
        GM_setValue(Parametros.PARAMETROS_JANELA, dadosAbertura.posicao);
      }
    }
  },
};
