import * as key_val from 'idb-keyval';
import { NumProc } from './NumProc';
import { Prioridade } from './Prioridade';

const DB_NAME = 'eproc-favoritos-historico';
export interface Item {
  /** Timestamp de quando foi adicionado como favorito */
  favorito: Favorito | undefined;
  /** Timestamp do último acesso */
  acesso: number;
}

export interface Favorito {
  prioridade: Prioridade;
  motivo: string;
  timestamp: number;
}

class Store {
  private _store: key_val.UseStore;
  private constructor() {
    this._store = key_val.createStore(DB_NAME, 'itens');
  }

  get(numproc: NumProc) {
    return key_val.get<Item>(numproc, this._store);
  }

  getAll() {
    return key_val.entries<NumProc, Item>(this._store);
  }

  set(numproc: NumProc, item: Item) {
    return key_val.set(numproc, item, this._store);
  }

  update(numproc: NumProc, update: (item: Item | undefined) => Item) {
    return key_val.update(numproc, update, this._store);
  }

  static getInstance() {
    return new Store();
  }
}

export async function verificar_favorito(numproc: NumProc) {
  const item = await Store.getInstance().get(numproc);
  return item?.favorito;
}

export async function salvar_favorito({
  motivo,
  numproc,
  prioridade,
}: {
  numproc: NumProc;
  motivo: string;
  prioridade: Prioridade;
}) {
  const timestamp = new Date().getTime();
  await Store.getInstance().set(numproc, {
    favorito: { motivo, prioridade, timestamp },
    acesso: timestamp,
  });
}

export async function importar_favorito({
  numproc,
  ...favorito
}: {
  numproc: NumProc;
  motivo: string;
  prioridade: Prioridade;
  timestamp: number;
}) {
  Store.getInstance().update(numproc, item => {
    const acesso = item === undefined ? favorito.timestamp : item.acesso;
    return { acesso, favorito };
  });
}

export async function remover_favorito(numproc: NumProc) {
  await Store.getInstance().set(numproc, {
    favorito: undefined,
    acesso: new Date().getTime(),
  });
}

export async function acrescentar_historico(numproc: NumProc) {
  await Store.getInstance().update(numproc, dados => {
    const { favorito } = dados ?? {};
    return { favorito, acesso: new Date().getTime() };
  });
}

export async function obter_historico() {
  return (await Store.getInstance().getAll())
    .map(([numproc, item]) => ({
      numproc,
      ...item,
    }))
    .sort((a, b) => b.acesso - a.acesso);
}

export async function obter_favoritos() {
  return (await Store.getInstance().getAll())
    .flatMap(([numproc, { favorito }]) => {
      if (favorito === undefined) return [];
      return { numproc, ...favorito };
    })
    .sort((a, b) => {
      if (a.prioridade !== b.prioridade) return b.prioridade - a.prioridade;
      return b.timestamp - a.timestamp;
    });
}
