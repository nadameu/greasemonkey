import * as key_val from 'idb-keyval';
import { NumProc } from './NumProc';
import { Prioridade } from './Prioridade';

const DB_NAME = 'eproc-favoritos-historico';
const STORE_NAME = 'itens';
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
  private _store: key_val.UseStore | null = null;
  private constructor() {}

  private _getStore(): key_val.UseStore {
    if (this._store) return this._store;
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = ({ oldVersion }) => {
      if (oldVersion < 1) {
        request.result.createObjectStore(STORE_NAME);
      }
      const store = request.transaction!.objectStore(STORE_NAME);
      if (oldVersion < 2) {
        store.createIndex('acesso', ['acesso']);
      }
    };
    const dbp = key_val.promisifyRequest(request);
    return (this._store = (txMode, callback) =>
      dbp.then(db =>
        callback(db.transaction(STORE_NAME, txMode).objectStore(STORE_NAME))
      ));
  }

  get(numproc: NumProc) {
    return key_val.get<Item>(numproc, this._getStore());
  }

  getAll() {
    return key_val.entries<NumProc, Item>(this._getStore());
  }

  prune(max_records_to_keep: number) {
    return this._getStore()('readwrite', async store => {
      const results: [NumProc, Item][] = [];
      const index = store.index('acesso').openCursor(null, 'prev');
      let count = 0;
      const deletions: IDBRequest<undefined>[] = [];
      index.onsuccess = () => {
        const cursor = index.result;
        if (cursor !== null) {
          count += 1;
          const numproc = cursor.primaryKey as NumProc;
          const item = cursor.value as Item;
          if (count <= max_records_to_keep) {
            results.push([numproc, item]);
          } else if (item.favorito !== undefined) {
            // não apagar mas não adicionar à tabela
          } else {
            deletions.push(store.delete(numproc));
          }
          cursor.continue();
        }
      };
      await Promise.all(deletions.map(key_val.promisifyRequest));
      await key_val.promisifyRequest(index.transaction!);
      return results;
    });
  }

  set(numproc: NumProc, item: Item) {
    return key_val.set(numproc, item, this._getStore());
  }

  update(numproc: NumProc, update: (item: Item | undefined) => Item) {
    return key_val.update(numproc, update, this._getStore());
  }

  private static _instance: Store;
  static getInstance() {
    return (this._instance ??= new Store());
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

export async function obter_historico(max_records_to_keep: number) {
  await Store.getInstance().prune(max_records_to_keep);
  return (await Store.getInstance().getAll())
    .map(([numproc, item]) => ({
      numproc,
      ...item,
    }))
    .sort((a, b) => b.acesso - a.acesso);
}

export async function obter_favoritos() {
  return (await Store.getInstance().getAll())
    .filter(
      (dados): dados is [NumProc, Item & { favorito: {} }] =>
        dados[1].favorito !== undefined
    )
    .map(([numproc, { favorito }]): { numproc: NumProc } & Favorito => ({
      numproc,
      ...favorito,
    }))
    .sort((a, b) => {
      if (a.prioridade !== b.prioridade) return b.prioridade - a.prioridade;
      return b.timestamp - a.timestamp;
    });
}
