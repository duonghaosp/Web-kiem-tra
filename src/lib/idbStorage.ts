/**
 * Trình lưu trữ dữ liệu IndexedDB chuẩn của trình duyệt.
 * Không bị giới hạn 5MB như LocalStorage (có thể lưu trữ hàng trăm Megabytes).
 * Dùng làm kho lưu trữ bền vững cho ngân hàng đề và hình ảnh.
 */
const DB_NAME = 'GeoExamDB';
const STORE_NAME = 'keyval';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('Trình duyệt không hỗ trợ IndexedDB'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Lỗi đọc IndexedDB:', err);
    return null;
  }
}

export async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Lỗi ghi IndexedDB:', err);
  }
}
