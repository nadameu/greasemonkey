import * as idb from 'idb';
import * as pkg from '../package.json';

interface My_Database extends idb.DBSchema {
  favoritos: {
    key: string;
    value: {
      numproc: string;
      prioridade: number;
    };
    indexes: { prioridade: number };
  };
  historico: {
    key: number;
    value: { numproc: string; timestamp: number };
    indexes: { numproc: string; timestamp: number };
  };
}

async function abrir_db() {
  // DEBUG
  return await idb.openDB<My_Database>(pkg.name, 1, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const favoritos = db.createObjectStore('favoritos', {
          keyPath: 'numproc',
        });
        favoritos.createIndex('prioridade', 'prioridade', { unique: false });

        const historico = db.createObjectStore('historico', {
          autoIncrement: true,
        });
        historico.createIndex('numproc', 'numproc', { unique: true });
        historico.createIndex('timestamp', 'timestamp', { unique: false });
      }
    },
  });
}

export async function verificar_favorito(numproc: string): Promise<boolean> {
  const db = await abrir_db();
  const result = await db.getAll('favoritos', numproc);
  if (result.length > 1) throw new Error('Mais de um resultado.');
  return result.length === 1;
}

export async function salvar_favorito(numproc: string) {
  const db = await abrir_db();
  await db.put('favoritos', { numproc, prioridade: 0 });
}

export async function remover_favorito(numproc: string) {
  const db = await abrir_db();
  await db.delete('favoritos', numproc);
}
