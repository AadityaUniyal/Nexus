/**
 * IndexedDB helper for Driver PWA offline ping storage.
 */

const DB_NAME = "nexus_driver_pwa";
const DB_VERSION = 1;
const STORE_PINGS = "pending_pings";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PINGS)) {
        db.createObjectStore(STORE_PINGS, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queuePing(ping: {
  lat: number;
  lon: number;
  heading?: number | null;
  speed_mps?: number | null;
  accuracy_meters?: number | null;
  recorded_at: string;
}) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PINGS, "readwrite");
    tx.objectStore(STORE_PINGS).add(ping);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.error("Failed to queue ping in IndexedDB", err);
  }
}

export async function getPendingPings(): Promise<any[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PINGS, "readonly");
    const store = tx.objectStore(STORE_PINGS);
    const req = store.getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = reject;
    });
  } catch {
    return [];
  }
}

export async function clearPendingPings(ids: number[]) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PINGS, "readwrite");
    const store = tx.objectStore(STORE_PINGS);
    ids.forEach((id) => store.delete(id));
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.error("Failed to clear pings from IndexedDB", err);
  }
}
