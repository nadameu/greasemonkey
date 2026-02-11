export function log_erro(err: unknown) {
  console.group('<eproc-cartas-precatorias-externas>');
  console.error(err);
  console.groupEnd();
}
