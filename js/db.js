const DB_NAME = "controle-estoque-db";
const DB_VERSION = 2;
const STORE_NAME = "produtos";
const SETTINGS_STORE_NAME = "configuracoes";
const PREDEFINED_TAGS_KEY = "predefined-tags";

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
      let store;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      } else {
        store = request.transaction.objectStore(STORE_NAME);
      }

      if (!store.indexNames.contains("name")) {
        store.createIndex("name", "name", { unique: false });
      }

      if (!store.indexNames.contains("barcode")) {
        store.createIndex("barcode", "barcode", { unique: false });
      }

      if (!store.indexNames.contains("updatedAt")) {
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: "key" });
      }
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

export async function withSettingsStore(mode, callback) {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(SETTINGS_STORE_NAME, mode);
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
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

export async function getPredefinedTags() {
  return withSettingsStore("readonly", async (store) => {
    const record = await promisifyRequest(store.get(PREDEFINED_TAGS_KEY));
    return Array.isArray(record?.value) ? record.value : [];
  });
}

export async function savePredefinedTags(tags) {
  const normalizedTags = Array.isArray(tags) ? tags : [];

  return withSettingsStore("readwrite", async (store) =>
    promisifyRequest(
      store.put({
        key: PREDEFINED_TAGS_KEY,
        value: normalizedTags,
      }),
    ),
  );
}
