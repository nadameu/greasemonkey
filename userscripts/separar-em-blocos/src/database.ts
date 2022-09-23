import { assert, isAnyOf, isUndefined, NonNegativeInteger } from '@nadameu/predicates';
import { Bloco, isBloco, isIdBloco } from './types/Bloco';

function promisify(eventName: 'complete'): (tx: IDBTransaction) => Promise<void>;
function promisify(eventName: 'success'): <T = any>(req: IDBRequest<T>) => Promise<T>;
function promisify(eventName: 'complete' | 'success') {
  return <T = any>(obj: IDBTransaction | IDBRequest<T>): Promise<any> =>
    new Promise<T | void>((res, rej) => {
      obj.addEventListener('error', onReject, { once: true });
      obj.addEventListener(eventName, onResolve, { once: true });

      function onReject() {
        rej(obj.error);
        obj.removeEventListener(eventName, onResolve);
      }
      function onResolve() {
        if ('result' in obj) res(obj.result);
        else res();

        obj.removeEventListener('error', onReject);
      }
    });
}

const promisifyRequest = /* #__PURE__ */ promisify('success');

const promisifyTransaction = /* #__PURE__ */ promisify('complete');

export function open() {
  const req = indexedDB.open('gm-blocos', 4);
  req.addEventListener('upgradeneeded', onUpgradeNeeded, { once: true });

  return promisifyRequest(req);

  function onUpgradeNeeded({ oldVersion }: IDBVersionChangeEvent) {
    const db = req.result;
    const transaction = req.transaction!;
    let store: IDBObjectStore;
    if (oldVersion < 1) {
      store = db.createObjectStore('blocos', { keyPath: 'id' });
    } else {
      store = transaction.objectStore('blocos');
    }
    if (oldVersion < 2) {
      store.createIndex('nome', ['nome'], { unique: true });
    }
    if (oldVersion < 3) {
      store.deleteIndex('nome');
      store.createIndex('nome', 'nome', { unique: true });
    }
    if (oldVersion < 4) {
      store.createIndex('processos', 'processos', { multiEntry: true });
    }
  }
}

type TransactionMode = 'readonly' | 'readwrite';

function makeTransaction<T>(
  mode: TransactionMode,
  createRequests: (store: IDBObjectStore) => readonly [IDBRequest<T>]
): Promise<[T]>;
function makeTransaction<T, U>(
  mode: TransactionMode,
  createRequests: (store: IDBObjectStore) => readonly [IDBRequest<T>, IDBRequest<U>]
): Promise<[T, U]>;
function makeTransaction<T, U, V>(
  mode: TransactionMode,
  createRequests: (store: IDBObjectStore) => readonly [IDBRequest<T>, IDBRequest<U>, IDBRequest<V>]
): Promise<[T, U, V]>;
function makeTransaction<T>(
  mode: TransactionMode,
  createRequests: (store: IDBObjectStore) => readonly IDBRequest<T>[]
): Promise<T[]>;
async function makeTransaction<T>(
  mode: TransactionMode,
  createRequests: (store: IDBObjectStore) => readonly IDBRequest<T>[]
): Promise<T[]> {
  const db = await open();
  const tx = db.transaction('blocos', mode);
  const store = tx.objectStore('blocos');
  const requests = createRequests(store);
  const [results, done] = await Promise.all([
    Promise.all(requests.map(promisifyRequest)),
    promisifyTransaction(tx),
  ]);
  return results;
}

export async function deleteBlocos() {
  await promisifyRequest(indexedDB.deleteDatabase('gm-blocos'));
}

export async function getBlocos() {
  const [blocos] = await makeTransaction('readonly', store => [store.getAll()] as const);
  return validarBlocos(blocos);
}

function validarBlocos(blocos: any[]): Bloco[] {
  assert(blocos.every(isBloco), 'Formato do banco de dados desconhecido.');
  return blocos.sort(compararBlocos);
}

type CompareFn<T> = (a: T, b: T) => -1 | 0 | 1;

const compararBlocos = /* #__PURE__ */ compareUsing(
  (bloco: Bloco) => bloco.nome as string,
  alt(
    compareUsing(x => x.toLowerCase()),
    compareDefault,
    nome => {
      throw new Error(`Há dois blocos com o mesmo nome: ${JSON.stringify(nome)}.`);
    }
  )
);

function alt<T>(...fns: CompareFn<T>[]): CompareFn<T> {
  return (a, b) => {
    for (const fn of fns) {
      const result = fn(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
}

function compareDefault<T>(a: T, b: T): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return +1;
  return 0;
}

function compareUsing<T, U>(
  f: (_: T) => U,
  compareFn: CompareFn<U> = compareDefault
): CompareFn<T> {
  return (a, b) => compareFn(f(a), f(b));
}

export async function getBloco(id: NonNegativeInteger) {
  const [bloco] = await makeTransaction('readonly', store => [store.get(id)]);
  assert(isAnyOf(isBloco, isUndefined)(bloco));
  return bloco;
}

export const createBloco = /* #__PURE__*/ writeBloco('add');

export async function deleteBloco(id: Bloco['id']) {
  const [done, blocos] = await makeTransaction(
    'readwrite',
    store => [store.delete(id), store.getAll()] as const
  );
  return validarBlocos(blocos);
}

export const updateBloco = /* #__PURE__ */ writeBloco('put');

function writeBloco(method: 'add' | 'put'): (bloco: Bloco) => Promise<Bloco[]> {
  return async bloco => {
    const [id, blocos] = await makeTransaction(
      'readwrite',
      store => [store[method](bloco), store.getAll()] as const
    );
    assert(isIdBloco(id));
    return validarBlocos(blocos);
  };
}
