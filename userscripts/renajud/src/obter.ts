import { assert, isNotNull } from '@nadameu/predicates';

export function obterPorId(id: string) {
  const elemento = document.getElementById(id);
  assert(isNotNull(elemento), `Não encontrado: #${id}.`);
  return elemento;
}

export function obterPorTipoId<K extends keyof HTMLElementTagNameMap>(tagName: K, id: string) {
  const elemento = document.querySelector<HTMLElementTagNameMap[K]>(`${tagName}[id="${id}"]`);
  assert(isNotNull(elemento), `Não encontrado: ${tagName}#${id}.`);
  return elemento;
}
