export function validar_mensagem(
  msg: unknown
): msg is { processo_aberto: string } {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'processo_aberto' in msg &&
    typeof msg.processo_aberto === 'string' &&
    /^[0-9]{20}$/.test(msg.processo_aberto)
  );
}
