export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("meetupDB", 2);

   request.onupgradeneeded = (e) => {
    console.log("🔥 DB upgraded to v2");
  const db = e.target.result;

  if (!db.objectStoreNames.contains("notifications")) {
    const store = db.createObjectStore("notifications", {
      keyPath: "uniqueId",
    });

    store.createIndex("type", "type", { unique: false });
    store.createIndex("time", "time", { unique: false });
  }

  // ✅ ADD THIS
  if (!db.objectStoreNames.contains("unread")) {
    const unreadStore = db.createObjectStore("unread", {
      keyPath: "id",
    });

    unreadStore.createIndex("type", "type", { unique: false });
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

export async function addNotification(data) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("notifications", "readwrite");
    const store = tx.objectStore("notifications");

    const request = store.put({
      uniqueId: data.uniqueId, // messageId
      chatId: data.chatId,
      senderId: data.senderId,
      type: data.type || "chat",
      time: Date.now(),
      read: false,
    });

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject("Failed to save notification");
  });
}


export async function getUnreadCount(chatId) {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction("notifications", "readonly");
    const store = tx.objectStore("notifications");

    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result;

      const count = all.filter(
        (n) => n.chatId === chatId && !n.read
      ).length;

      resolve(count);
    };
  });
}

export async function markChatAsRead(chatId) {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction("notifications", "readwrite");
    const store = tx.objectStore("notifications");

    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result;

      all.forEach((item) => {
        if (item.chatId === chatId && !item.read) {
          item.read = true;
          store.put(item);
        }
      });

      resolve(true);
    };
  });
}



export async function updateUnread(id, count, type = "chat") {
  const db = await openDB();

  console.log("🔥 saving unread:", id, count);
  return new Promise((resolve) => {
    const tx = db.transaction("unread", "readwrite");
    const store = tx.objectStore("unread");

    store.put({
      id,
      count,
      type,
    });

    resolve(true);
  });
}


export async function getAllUnread() {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction("unread", "readonly");
    const store = tx.objectStore("unread");

    const req = store.getAll();

    req.onsuccess = () => {
      const result = {};

      req.result.forEach((item) => {
        result[item.id] = item.count;
      });

      resolve(result);
    };
  });
}


export async function clearUnread(id) {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction("unread", "readwrite");
    const store = tx.objectStore("unread");

    store.delete(id);

    resolve(true);
  });
}