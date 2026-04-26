import { openDB } from "./indexedDB";

export async function saveNotification(data) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("notifications", "readwrite");
    const store = tx.objectStore("notifications");

    const uniqueId = `${data.type}_${data.user._id}`;

    const request = store.put({
      ...data,
      uniqueId, // 🔥 prevents duplicate
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(false);
  });
}