export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("meetupDB", 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains("notifications")) {
        const store = db.createObjectStore("notifications", {
          keyPath: "uniqueId",
        });

        store.createIndex("type", "type", { unique: false });
        store.createIndex("time", "time", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("DB error");
  });
}


export async function clearAllNotifications() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("notifications", "readwrite");
    const store = tx.objectStore("notifications");

    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject("Failed to clear notifications");
  });
}