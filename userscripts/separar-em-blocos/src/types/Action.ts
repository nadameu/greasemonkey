import * as p from '@nadameu/predicates';
import { isBloco, isBlocoProcesso, isIdBloco, isNomeBloco } from './Bloco';
import { isNumProc } from './NumProc';

export const isClientMessage = /* #__PURE__ */ p.isTaggedUnion('type', {
  ObterBlocosProcesso: { numproc: isNumProc },
  InserirProcesso: { bloco: isIdBloco, numproc: isNumProc },
  RemoverProcesso: { bloco: isIdBloco, numproc: isNumProc },
});
export type ClientMessage = p.Static<typeof isClientMessage>;

export const isRequestMessage = /* #__PURE__ */ p.hasShape({
  requestId: p.isNonNegativeInteger,
  message: isClientMessage,
});
export type RequestMessage = p.Static<typeof isRequestMessage>;

export const isClientAction = /* #__PURE__ */ p.isTaggedUnion('type', {
  InserirEmBloco: { bloco: isIdBloco },
  RemoverDeBloco: { bloco: isIdBloco },
});
export type ClientAction = p.Static<typeof isClientAction>;

export const isServerMessage = /* #__PURE__ */ p.isTaggedUnion('type', {
  FornecerBlocosProcesso: {
    blocos: p.isArray(isBlocoProcesso),
  },
});
export type ServerMessage = p.Static<typeof isServerMessage>;

export const isResponseMessage = /* #__PURE__ */ p.hasShape({
  responseId: p.isNonNegativeInteger,
  message: isServerMessage,
});
export type ResponseMessage = p.Static<typeof isResponseMessage>;

export const isServerLoadingAction = /* #__PURE__ */ p.isTaggedUnion('type', {
  AtualizarBlocos: { blocos: p.isArray(isBloco) },
  DadosInvalidos: { motivo: p.isString },
  Erro: { motivo: p.isString },
  ObterDados: {},
});
export type ServerLoadingAction = p.Static<typeof isServerLoadingAction>;

export const isServerLoadedAction = /* #__PURE__ */ p.isTaggedUnion('type', {
  AtualizacaoExterna: { blocos: p.isArray(isBloco) },
  CriarBloco: { nome: isNomeBloco },
  Erro: { motivo: p.isString },
  ExcluirBloco: { bloco: isIdBloco },
  RenomearBloco: { bloco: isIdBloco, nome: isNomeBloco },
  SelecionarProcessos: { bloco: isIdBloco },
});
export type ServerLoadedAction = p.Static<typeof isServerLoadedAction>;

export const isServerErrorAction = /* #__PURE__ */ p.isTaggedUnion('type', {
  Erro: { motivo: p.isString },
  ExcluirBanco: {},
  ObterDados: {},
});
export type ServerErrorAction = p.Static<typeof isServerErrorAction>;

export type ServerAction = ServerLoadingAction | ServerLoadedAction | ServerErrorAction;

export const isBroadcastMessage = /* #__PURE__ */ p.isTaggedUnion('type', {
  Blocos: { blocos: p.isArray(isBloco) },
  NoOp: {},
});
export type BroadcastMessage = p.Static<typeof isBroadcastMessage>;
