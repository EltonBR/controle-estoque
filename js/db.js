const DB_NAME = "controle-estoque-db";
const DB_VERSION = 1;
const STORE_NAME = "produtos";

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha no IndexedDB"));
  });
}

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });

      store.createIndex("name", "name", { unique: false });
      store.createIndex("barcode", "barcode", { unique: false });
      store.createIndex("updatedAt", "updatedAt", { unique: false });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Nao foi possivel abrir o banco"));
  });
}

export async function withStore(mode, callback) {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = await callback(store);

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Transacao falhou"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Transacao abortada"));
    });

    return result;
  } finally {
    db.close();
  }
}

export async function getAllProducts() {
  return withStore("readonly", async (store) => {
    const products = await promisifyRequest(store.getAll());

    return products.sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return aTime - bTime;
    });
  });
}

export async function saveProduct(product) {
  return withStore("readwrite", async (store) => promisifyRequest(store.put(product)));
}

export async function deleteProduct(id) {
  return withStore("readwrite", async (store) => promisifyRequest(store.delete(id)));
}

export async function replaceAllProducts(products) {
  return withStore("readwrite", async (store) => {
    await promisifyRequest(store.clear());

    for (const product of products) {
      const normalized = { ...product };

      if (normalized.id === null || normalized.id === undefined || normalized.id === "") {
        delete normalized.id;
      }

      await promisifyRequest(store.put(normalized));
    }
  });
}
