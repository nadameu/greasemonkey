import { assert, isNotNull } from '@nadameu/predicates';

export function obterPorId(id: string) {
  return assegurarExistente(document.getElementById(id), `#${id}`);
}

export function obterPorSeletor<T extends HTMLElement>(seletor: string) {
  return assegurarExistente(document.querySelector<T>(seletor), seletor);
}

export function obterPorTipoId<K extends keyof HTMLElementTagNameMap>(tagName: K, id: string) {
  return assegurarExistente(
    document.querySelector<HTMLElementTagNameMap[K]>(`${tagName}[id="${id}"]`),
    `${tagName}#${id}.`
  );
}

function assegurarExistente<T>(obj: T | null, seletor: string) {
  assert(isNotNull(obj), `Não encontrado: ${seletor}.`);
  return obj;
}
