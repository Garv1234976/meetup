import { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

export function OnlinePanel() {
  const { socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // 🔥 FETCH SNAPSHOT
  useEffect(() => {
    async function fetchOnline() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACK_DEV_API}/admin/online-users`,
          { credentials: "include" }
        );

        const data = await res.json();

        // ✅ FIX: use actual user object
        const mapped = data.users.map((u) => ({
          ...u,
          isOnline: true,
        }));

        setUsers(mapped);
      } catch (err) {
        console.log("Failed to fetch online users");
      }
    }

    fetchOnline();
  }, []);


  useEffect(() => {
  async function fetchAnalytics() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/admin/analytics-today`,
        { credentials: "include" }
      );

      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.log("Analytics fetch failed");
    }
  }

  fetchAnalytics();
}, []);
  // 🔥 REALTIME SYNC
  useEffect(() => {
    if (!socket) return;

    const handleOnline = ({ userId }) => {
      setUsers((prev) => {
        const exists = prev.find((u) => u._id === userId);
        if (exists) return prev;

        // 🔥 fallback (if user not in list yet)
        return [
          ...prev,
          {
            _id: userId,
            name: "New User",
            picture: "/m.svg",
            isOnline: true,
          },
        ];
      });
    };

    const handleOffline = ({ userId }) => {
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    };

    socket.on("user_online", handleOnline);
    socket.on("user_offline", handleOffline);

    return () => {
      socket.off("user_online", handleOnline);
      socket.off("user_offline", handleOffline);
    };
  }, [socket]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* 🔹 HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          🟢 Online Users
        </h2>

        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
          {users.length} active
        </span>
      </div>

      {analytics && (
  <div className="grid grid-cols-2 gap-3 mb-4">

    <div className="bg-white p-3 rounded-xl shadow-sm">
      <p className="text-xs text-gray-400">DAU</p>
      <p className="text-lg font-bold text-blue-500">
        {analytics.dau}
      </p>
    </div>

    <div className="bg-white p-3 rounded-xl shadow-sm">
      <p className="text-xs text-gray-400">Messages</p>
      <p className="text-lg font-bold text-green-500">
        {analytics.messages}
      </p>
    </div>

    <div className="bg-white p-3 rounded-xl shadow-sm">
      <p className="text-xs text-gray-400">Channels</p>
      <p className="text-lg font-bold text-purple-500">
        {analytics.channels}
      </p>
    </div>

    <div className="bg-white p-3 rounded-xl shadow-sm">
      <p className="text-xs text-gray-400">Broadcasts</p>
      <p className="text-lg font-bold text-pink-500">
        {analytics.broadcasts}
      </p>
    </div>

    <div className="bg-white p-3 rounded-xl shadow-sm col-span-2">
      <p className="text-xs text-gray-400">Friend Requests</p>
      <p className="text-lg font-bold text-orange-500">
        {analytics.requests}
      </p>
    </div>

  </div>
)}

      {/* 🔹 LIST */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center mt-20 text-gray-400">
          <span className="text-3xl">😴</span>
          <p className="text-sm mt-2">No users online</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {users.map((u, i) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between bg-white rounded-xl shadow-sm px-3 py-2"
              >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={u.picture || "/m.svg"}
                      className="w-10 h-10 rounded-full object-cover"
                    />

                    {/* 🟢 ONLINE DOT */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {u.name || "Unknown"}
                    </p>

                    <p className="text-[11px] text-gray-400">
                      Active now
                    </p>
                  </div>
                </div>

                {/* RIGHT */}
                <span className="text-green-500 text-xs font-semibold">
                  ● Online
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}