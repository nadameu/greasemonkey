const unidades: Array<{
  max_exclusive: number;
  format: (distance: number, absolute: Date) => string;
}> = [
  { max_exclusive: 1000, format: _ms => 'Agora' },
  { max_exclusive: 60, format: s => `Há ${formatar_plural(s, 'segundo')}` },
  { max_exclusive: 60, format: s => `Há ${formatar_plural(s, 'minuto')}` },
  { max_exclusive: 24, format: s => `Há ${formatar_plural(s, 'hora')}` },
  { max_exclusive: 365, format: s => `Há ${formatar_plural(s, 'dia')}` },
  {
    max_exclusive: Number.POSITIVE_INFINITY,
    format: (_, d) => d.toLocaleDateString(),
  },
];

export function formatar_intervalo(inicio: Date, fim: Date) {
  const intervalo_ms = fim.getTime() - inicio.getTime();
  let current = intervalo_ms;
  for (const unidade of unidades) {
    if (current < unidade.max_exclusive) {
      return unidade.format(current, inicio);
    } else {
      current = Math.floor(current / unidade.max_exclusive);
    }
  }
  throw new Error('Erro inesperado.');
}

export function formatar_plural(n: number, singular: string) {
  return `${n.toString()} ${singular}${n > 1 ? 's' : ''}`;
}
