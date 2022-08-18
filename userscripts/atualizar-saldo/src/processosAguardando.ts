import { check, isArray } from '@nadameu/predicates';
import { isNumproc, NumProc } from './NumProc';

export const STORAGE_KEY = 'gm-atualizar-saldo-rpv';

export function obterProcessosAguardando() {
  try {
    return check(isArray(isNumproc), JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
  } catch (_) {
    return [];
  }
}
export function adicionarProcessoAguardando(numproc: NumProc) {
  salvarProcessosAguardando(obterProcessosAguardando().concat([numproc]));
}
export function removerProcessoAguardando(numproc: NumProc) {
  salvarProcessosAguardando(obterProcessosAguardando().filter(p => p !== numproc));
}
function salvarProcessosAguardando(processos: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(processos));
}
