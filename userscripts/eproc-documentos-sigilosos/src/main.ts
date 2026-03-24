import { CustomError } from './CustomError';
import { tela_alteracao_em_bloco } from './tela_alteracao_em_bloco';
import { tela_permissao_expressa } from './tela_permissao_expressa';

export function main() {
  const acao = new URL(document.location.href).searchParams.get('acao');
  switch (acao) {
    case 'processo_documento_sigilo_listar':
      return tela_alteracao_em_bloco();
    case 'acesso_usuario_documento_listar':
      return tela_permissao_expressa();
    default:
      throw new CustomError('Ação desconhecida', { acao });
  }
}
