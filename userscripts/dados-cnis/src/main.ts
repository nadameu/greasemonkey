import { h } from '@nadameu/create-element';
import { Either, Left, Right, sequence } from '@nadameu/either';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import { createStore } from '../../../lib/create-store';
import { createCustomEventDispatcher, onCustomEvent } from './CustomEvent';
import { Estado } from './Estado';
import { Mensagem, isMensagem } from './Mensagem';
import './estilos.scss';
import { queryAll } from './queryAll';
import { queryOne } from './queryOne';
import { paginaProcessoSelecionar } from './paginaProcessoSelecionar';
import { paginaListar } from './paginaListar';
import * as p from '@nadameu/predicates';

const isAcaoValida = p.isAnyOf(
  ...(['processo_selecionar', 'pessoa_consulta_integrada/listar'] as const).map(x => p.isLiteral(x))
);

export function main(): Either<Error, void> {
  const url = new URL(document.URL);
  const acao = url.searchParams.get('acao');
  if (p.isNull(acao)) return Left(new Error(`Página desconhecida: ${JSON.stringify(url.href)}.`));
  if (!isAcaoValida(acao)) return Left(new Error(`Ação desconhecida: ${JSON.stringify(acao)}.`));
  switch (acao) {
    case 'processo_selecionar':
      return paginaProcessoSelecionar();

    case 'pessoa_consulta_integrada/listar':
      return paginaListar();

    default:
      return expectUnreachable(acao);
  }
}
