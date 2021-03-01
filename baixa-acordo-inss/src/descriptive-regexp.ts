type Expr = string | RegExp;

export function concat(...exprs: Expr[]) {
  return RegExp(exprs.map(toSource).join(''));
}

export function fromExpr(expr: Expr) {
  return typeof expr === 'string' ? literal(expr) : expr;
}

export function toSource(expr: Expr) {
  return fromExpr(expr).source;
}

export function literal(text: string) {
  return RegExp(text.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d'));
}

export function oneOf(...exprs: Expr[]) {
  return RegExp(`(?:${exprs.map(toSource).join('|')})`);
}

export function optional(expr: Expr) {
  const source = toSource(expr);
  if (source.length === 1) return RegExp(`${source}?`);
  else return RegExp(`(?:${toSource(expr)})?`);
}

export function withFlags(expr: Expr, flags?: string) {
  return RegExp(toSource(expr), flags);
}

export function capture(expr: Expr) {
  const src = toSource(expr);
  const sanitized = src.match(/^\(\?:(.*)\)$/)?.[1] ?? src;
  return RegExp(`(${sanitized})`);
}

export function test(text: string, expr: Expr) {
  return fromExpr(expr).test(text);
}

export function match(text: string, expr: Expr) {
  return text.match(fromExpr(expr));
}

export function matchAll(text: string, expr: Expr) {
  return text.matchAll(fromExpr(expr));
}

export function exactly(expr: Expr) {
  return RegExp(`^${toSource(expr)}$`);
}
