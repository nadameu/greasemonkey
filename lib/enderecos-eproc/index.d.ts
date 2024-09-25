/**
 * Cria URLs correspondentes a todos os endereços do eproc da JF4.
 * @param {string} params Parâmetros da página controlador.php, p. ex. `acao=processo_listar&*`
 * @returns {string[]} Lista de URLs para serem usadas com o campo `@match`.
 */
export function enderecosEproc(params: string): string[];
