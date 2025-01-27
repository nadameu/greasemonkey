import { NumProc } from './NumProc';

export function formatar_numproc(numproc: NumProc) {
  let index = 0;
  return '#######-##.####.#.##.####'.replace(/#/g, () => numproc[index++]!);
}
