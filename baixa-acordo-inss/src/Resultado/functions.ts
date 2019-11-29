import { Invalido, Ok, Resultado } from './defs';

type Matchers<a, b> = {
  Ok(valor: a): b;
  Invalido(razoes: string[]): b;
};

export function matchWith<a, b>(resultado: Resultado<a>, matchers: Matchers<a, b>): b;
export function matchWith<a, b>(resultado: Resultado<a>, matchers: Matchers<a, b>): b {
  if (resultado.isValido) return matchers.Ok(resultado.valor);
  return matchers.Invalido(resultado.razoes);
}

export function chain<a, b>(fx: Resultado<a>, f: (_: a) => Resultado<b>): Resultado<b> {
  return fx.isValido ? f(fx.valor) : fx;
}

export function map<a, b>(fx: Resultado<a>, f: (_: a) => b): Resultado<b> {
  return chain(fx, x => Ok(f(x)));
}

export function lift2<a, b, c>(
  fa: Resultado<a>,
  fb: Resultado<b>,
  f: (a: a, b: b) => c
): Resultado<c> {
  if (fa.isValido)
    if (fb.isValido) return Ok(f(fa.valor, fb.valor));
    else return fb;
  if (fb.isValido) return fa;
  return Invalido(fa.razoes.concat(fb.razoes));
}

export function traverse<a, b>(xs: a[], f: (_: a) => Resultado<b>): Resultado<b[]> {
  return xs.reduce(
    (fys: Resultado<b[]>, x) =>
      lift2(fys, f(x), (ys, y) => {
        ys.push(y);
        return ys;
      }),
    Ok([])
  );
}

export function traverseObj<a extends object, b>(
  obj: a,
  f: (_: a[keyof a]) => Resultado<b>
): Resultado<{ [key in keyof a]: b }> {
  return (Object.entries(obj) as [keyof a, a[keyof a]][]).reduce(
    (resultado, [key, x]) =>
      lift2(resultado, f(x), (target, y) => {
        target[key] = y;
        return target;
      }),
    Ok({}) as Resultado<{ [key in keyof a]: b }>
  );
}

export function sequence<a>(xs: [Resultado<a>]): Resultado<[a]>;
export function sequence<a, b>(xs: [Resultado<a>, Resultado<b>]): Resultado<[a, b]>;
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

export function sequenceObj<a extends { [key in keyof a]: Resultado<unknown> }>(
  obj: a
): Resultado<{ [key in keyof a]: a[key] extends Resultado<infer b> ? b : never }> {
  return traverseObj(obj, x => x as Resultado<any>);
}
