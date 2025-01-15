export function formatar_numproc(numproc: import('./database').NumProc) {
  let index = 0;
  return '#######-##.####.#.##.####'.replace(/#/g, () => numproc[index++]);
}
