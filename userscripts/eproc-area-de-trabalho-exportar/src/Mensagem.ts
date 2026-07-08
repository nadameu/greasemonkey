export interface Mensagem {
  segredo: string;
  estilos: string[];
  minutas: Minuta[];
}

export interface Minuta {
  titulo: string;
  codigo: string;
  html: string;
}

export function is_mensagem(value: unknown): value is Mensagem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'segredo' in value &&
    'estilos' in value &&
    'minutas' in value &&
    typeof value.segredo === 'string' &&
    Array.isArray(value.estilos) &&
    value.estilos.every(e => typeof e === 'string') &&
    Array.isArray(value.minutas) &&
    value.minutas.every(isMinuta)
  );
}

export function isMinuta(value: unknown): value is Minuta {
  return (
    typeof value === 'object' &&
    value !== null &&
    'titulo' in value &&
    'codigo' in value &&
    'html' in value &&
    typeof value.titulo === 'string' &&
    typeof value.codigo === 'string' &&
    typeof value.html === 'string'
  );
}
