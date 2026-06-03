
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Creation } from '@/context/CreationsContext';

const DB_NAME = 'gemini-studio-db';
const STORE_NAME = 'creations';
const DB_VERSION = 1;

interface GeminiStudioDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: Creation;
    indexes: { path: string };
  };
}

let dbPromise: Promise<IDBPDatabase<GeminiStudioDB>> | null = null;

const getDb = (): Promise<IDBPDatabase<GeminiStudioDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<GeminiStudioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
          });
          store.createIndex('path', 'path');
        }
      },
    });
  }
  return dbPromise;
};

export const getAllCreations = async (): Promise<Creation[]> => {
  const db = await getDb();
  const creations = await db.getAll(STORE_NAME);
  return creations.sort((a, b) => b.timestamp - a.timestamp);
};

export const addCreationToDB = async (creation: Creation): Promise<void> => {
  const db = await getDb();
  await db.put(STORE_NAME, creation);
};

export const updateCreationInDB = async (creation: Creation): Promise<void> => {
  const db = await getDb();
  await db.put(STORE_NAME, creation);
};

export const removeCreationFromDB = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
};

export const getCreationFromDB = async (id: string): Promise<Creation | undefined> => {
    const db = await getDb();
    return await db.get(STORE_NAME, id);
};
