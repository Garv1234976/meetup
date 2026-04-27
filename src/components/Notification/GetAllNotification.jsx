import { useEffect, useState } from "react";
import { openDB, clearAllNotifications } from "../../../utils/indexedDB";
import Logo from "/logo.svg";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function GetAllNotification() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  async function getNotifications() {
    const db = await openDB();

    return new Promise((resolve) => {
      const tx = db.transaction("notifications", "readonly");
      const store = tx.objectStore("notifications");

      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  useEffect(() => {
    async function load() {
      const data = await getNotifications();

      const sorted = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setNotifications(sorted);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* 🔹 HEADER */}
      <header className="flex items-center justify-between px-4 py-3 bg-white shadow">
        <img src={Logo} className="w-28" />

        <h2 className="text-lg font-bold">Notifications</h2>


        {/* ❌ Back */}
        <button
          onClick={() => navigate("/chats")}
          className="text-xl font-bold text-gray-600 hover:text-black"
        >
          ✕
        </button>
      </header>


      {/* 🔹 BODY */}
      <main className="flex-1 overflow-y-auto p-4">
 <div className="flex justify-end py-3">
  {notifications.length > 0 && (
      <button
        onClick={async () => {
          await clearAllNotifications();
          setNotifications([]);
        }}
        className="text-xs bg-red-100 font-semibold border text-red-500 px-2 py-1 rounded-md hover:bg-red-200"
      >
        Clear All
      </button>
    )}
 </div>
        {notifications.length === 0 && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center mt-20 text-center"
  >
    <div className="text-4xl mb-3">🔔</div>

    <p className="text-gray-500 text-sm font-medium">
      No notifications found
    </p>

    <button
      onClick={() => navigate("/chats")}
      className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
    >
      Go to Chats
    </button>
  </motion.div>
)}


        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {notifications.map((n) => (
              <motion.div
                key={n.uniqueId}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 p-3 bg-white shadow rounded-xl"
              >
                {/* Avatar */}
                <img
                  src={n.user?.picture || "/m.svg"}
                  onError={(e) => (e.target.src = "/m.svg")}
                  className="w-10 h-10 rounded-full"
                />

                {/* Text */}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {getMessage(n)}
                  </p>

                  <span className="text-xs text-gray-400">
                    {formatTime(n.createdAt)}
                  </span>
                </div>

                {n.type === "accepted_by_other" && (
            <span className="text-green-500 text-xs font-semibold">
                    Accepted
                </span>
                )}

                {n.type === "you_accepted" && (
                <span className="text-blue-500 text-xs font-semibold">
                    Connected
                </span>
                )}
                {/* Badge */}
                {n.type === "declined_by_other" && (
                  <span className="text-red-500 text-xs font-semibold">
                    Declined
                  </span>
                )}

                {n.type === "you_declined" && (
                  <span className="text-yellow-500 text-xs font-semibold">
                    You declined
                  </span>
                )}


              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* 🔹 FOOTER */}
      <footer className="bg-white text-center py-3 text-xs text-gray-500 border-t">
        © {new Date().getFullYear()} Meetup App • Notifications
      </footer>
    </div>
  );
}

function getMessage(n) {
  if(n.type === "new_request"){
    console.log(n.user);
    return `${n.user.name} sends friend request to you.`
  }
  if (n.type === "declined_by_other") {
    return `${n.user?.name} declined your request ❌`;
  }

  if (n.type === "you_declined") {
    return `You declined ${n.user?.name}'s request`;
  }

  if (n.type === "accepted_by_other") {
    return `${n.user?.name} accepted your request 🎉`;
  }

  if (n.type === "you_accepted") {
    return `You are now friends with ${n.user?.name}`;
  }

  return n.message || "Notification";
}
function formatTime(date) {
  if (!date) return "";

  const d = new Date(date);
  return d.toLocaleString();
}