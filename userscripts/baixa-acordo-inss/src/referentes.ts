export function obterReferencias(descricao: string): number[] {
  const match = descricao.match(
    /Refer\. +aos? Eventos?\:? +((?:(?:\d+, *)*\d+ *e *)?\d+)/
  );
  if (!match) return [];
  const textoEventos = match[1]!.split(/, *| *e */g);
  return textoEventos.map(Number).sort((a, b) => a - b);
}
