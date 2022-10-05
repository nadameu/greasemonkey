import { Either, Left, Right } from '@nadameu/either';

export function obterPorId(id: string) {
  return assegurarExistente(document.getElementById(id), `#${id}`);
}

export function obterPorSeletor<T extends HTMLElement>(seletor: string) {
  return assegurarExistente(document.querySelector<T>(seletor), seletor);
}

export function obterPorTipoId<K extends keyof HTMLElementTagNameMap>(tagName: K, id: string) {
  return obterPorSeletor<HTMLElementTagNameMap[K]>(`${tagName}[id="${id}"]`);
}

function assegurarExistente<T>(obj: T | null, seletor: string): Either<Error, T> {
  if (!obj) return Left(new Error(`Não encontrado: ${seletor}.`));
  return Right(obj);
}
