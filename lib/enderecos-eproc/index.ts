const urlInfo = ['pr', 'rs', 'sc']
  .map(uf => `eproc.jf${uf}.jus.br`)
  .map(domain => ({ domain, directory: 'eprocV2' }))
  .concat([{ domain: 'eproc.trf4.jus.br', directory: 'eproc2trf4' }]);

/**
 * Cria URLs correspondentes a todos os endereços do eproc da JF4.
 * @param params Parâmetros da página controlador.php, p. ex. `acao=processo_listar&*`
 * @returns Lista de URLs para serem usadas com o campo `@match`.
 */
export function enderecosEproc(params: string): string[] {
  return urlInfo.map(
    ({ domain, directory }) =>
      `https://${domain}/${directory}/controlador.php?${params}`
  );
}
