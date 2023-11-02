import { Invalido, Ok, Resultado } from './defs';

export function chain<a, b>(
  fx: Resultado<a>,
  f: (_: a) => Resultado<b>
): Resultado<b> {
  return fx.isValido ? f(fx.valor) : fx;
}

export function map<a, b>(fx: Resultado<a>, f: (_: a) => b): Resultado<b> {
  return fx.isValido ? Ok(f(fx.valor)) : fx;
}

export function lift2<a, b, c>(
  fa: Resultado<a>,
  fb: Resultado<b>,
  f: (a: a, b: b) => c
): Resultado<c> {
  return map(sequence([fa, fb]), ([a, b]) => f(a, b));
}

export function traverse<a, b>(
  xs: a[],
  f: (_: a) => Resultado<b>
): Resultado<b[]> {
  return _traverseEntries<Record<number, a>, b>(
    xs.entries(),
    f,
    []
  ) as Resultado<b[]>;
}

export function traverseObj<a, b>(
  obj: a,
  f: (_: a[keyof a]) => Resultado<b>
): Resultado<Record<keyof a, b>> {
  return _traverseEntries(Object.entries(obj) as [keyof a, a[keyof a]][], f);
}

function _traverseEntries<a, b>(
  entries: Iterable<[keyof a, a[keyof a]]>,
  f: (_: a[keyof a]) => Resultado<b>,
  resultado: Partial<Record<keyof a, b>> = {}
): Resultado<Record<keyof a, b>> {
  const razoess: string[][] = [];
  let valido = true;
  for (const [k, v] of entries) {
    const y = f(v);
    if (!y.isValido) {
      if (valido) valido = false;
      razoess.push(y.razoes);
    } else if (valido) resultado[k] = y.valor;
  }
  if (!valido) return Invalido(razoess.flat());
  return Ok(resultado as Record<keyof a, b>);
}

export function sequence<a>(xs: [Resultado<a>]): Resultado<[a]>;
export function sequence<a, b>(
  xs: [Resultado<a>, Resultado<b>]
): Resultado<[a, b]>;
export function sequence<a, b, c>(
  xs: [Resultado<a>, Resultado<b>, Resultado<c>]
): Resultado<[a, b, c]>;
export function sequence<a, b, c, d>(
  xs: [Resultado<a>, Resultado<b>, Resultado<c>, Resultado<d>]
): Resultado<[a, b, c, d]>;
export function sequence<a>(xs: Resultado<a>[]): Resultado<a[]>;
export function sequence<a>(xs: Resultado<a>[]): Resultado<a[]> {
  return traverse(xs, x => x);
}

export function sequenceObj<a extends Record<keyof a, Resultado<unknown>>>(
  obj: a
): Resultado<{
  [key in keyof a]: a[key] extends Resultado<infer b> ? b : never;
}> {
  return traverseObj(obj as Record<keyof a, Resultado<any>>, x => x);
}
