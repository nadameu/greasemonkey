type Nullable<a> = a | null | undefined;

export function safePipe(): undefined;
export function safePipe<a>(a: Nullable<a>): a;
export function safePipe<a, b>(
  a: Nullable<a>,
  ab: (_: a) => Nullable<b>
): Nullable<b>;
export function safePipe<a, b, c>(
  a: Nullable<a>,
  ab: (_: a) => Nullable<b>,
  bc: (_: b) => Nullable<c>
): Nullable<c>;
export function safePipe<a, b, c, d>(
  a: Nullable<a>,
  ab: (_: a) => Nullable<b>,
  bc: (_: b) => Nullable<c>,
  cd: (_: c) => Nullable<d>
): Nullable<d>;
export function safePipe<a, b, c, d, e>(
  a: Nullable<a>,
  ab: (_: a) => Nullable<b>,
  bc: (_: b) => Nullable<c>,
  cd: (_: c) => Nullable<d>,
  de: (_: d) => Nullable<e>
): Nullable<e>;
export function safePipe(a?: any, ...fs: Function[]) {
  return fs.reduce((a, f) => (a == null ? a : f(a)), a);
}
