
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddMembersModal({
  channelId,
  existingMembers = [],
  onClose,
}) {
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  // 🔥 toggle select
  const toggleUser = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  // 🔥 fetch friends
  useEffect(() => {
    setLoading(true);

    fetch(`${import.meta.env.VITE_BACK_DEV_API}/chats`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setFriends(data?.friends || []))
      .catch(() => setFriends([]))
      .finally(() => setLoading(false));
  }, []);

  // 🔥 existing members set (safe)
  const existingSet = new Set(existingMembers.map(String));

  // 🔥 filter friends
  const filteredFriends = friends
    .filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((f) => !existingSet.has(String(f._id)));

  // 🔥 remove already added from selection (important)
  useEffect(() => {
    setSelected((prev) =>
      prev.filter((id) => !existingSet.has(String(id)))
    );
  }, [existingMembers]);

  // 🔥 add members API
  const handleAddMembers = async () => {
    if (!selected.length || adding) return;

    try {
      setAdding(true);

      await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/channels/${channelId}/add-members`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ users: selected }),
        }
      );

      onClose();
      
  setTimeout(() => {
    window.location.reload();
  }, 150);
    } catch (err) {
      console.log("Add failed");
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
  const handler = (e) => {
    console.log({e});
    const { channelId } = e.detail;
    

    console.log("📢 New channel joined:", channelId);

    // optional: reload sidebar or channels list
  };

  window.addEventListener("channel-added", handler);

  return () => {
    window.removeEventListener("channel-added", handler);
  };
}, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-[90vh] bg-white rounded-t-2xl flex flex-col ${
            adding ? "pointer-events-none opacity-80" : ""
          }`}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >

          {/* 🔝 HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-lg">Add Members</span>
            <button onClick={onClose}>✕</button>
          </div>

          {/* 🔍 SEARCH */}
          <div className="px-3 py-2">
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
              <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm mr-2" />
              <input
                type="text"
                placeholder="Search contacts"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1"
              />
            </div>
          </div>

          {/* ⚡ SELECT ALL */}
          <div className="flex items-center justify-between px-3 pb-2">
            <button
              onClick={() => {
                if (selected.length === filteredFriends.length) {
                  setSelected([]);
                } else {
                  setSelected(filteredFriends.map((f) => f._id));
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs"
            >
              <i className="fa-solid fa-check-double text-[10px]" />
              {selected.length === filteredFriends.length
                ? "Unselect"
                : "Select All"}
            </button>

            <div className="text-xs text-gray-500 flex items-center gap-2">
              {selected.length > 0 && (
                <span className="bg-blue-500 text-white px-2 py-[2px] rounded-full text-[10px]">
                  {selected.length}
                </span>
              )}
              <span>
                {selected.length ? "Selected" : "No selection"}
              </span>
            </div>
          </div>

          {/* 👥 SELECTED USERS */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-b bg-white">
              <div className="flex gap-3 overflow-x-auto">
                {selected.map((id) => {
                  const user = friends.find(
                    (f) => String(f._id) === String(id)
                  );

                  return (
                    <div key={id} className="relative min-w-[60px] text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                        {user?.name?.charAt(0)}
                      </div>

                      <div
                        onClick={() => toggleUser(id)}
                        className="absolute top-0 right-1 w-4 h-4 bg-gray-700 text-white rounded-full text-[8px] flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </div>

                      <div className="text-[10px] truncate">
                        {user?.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 📋 LIST */}
          <div className="flex-1 overflow-y-auto">

            {/* 🔄 LOADING */}
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                  <div className="w-10 h-10 bg-gray-300 rounded-full" />
                  <div className="h-3 w-24 bg-gray-300 rounded" />
                </div>
              ))
            ) : filteredFriends.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm">
                No friends available
              </div>
            ) : (
              filteredFriends.map((f) => {
                const isSelected = selected.includes(f._id);

                return (
                  <div
                    key={f._id}
                    onClick={() => toggleUser(f._id)}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${
                          isSelected ? "bg-blue-400" : "bg-gray-400"
                        }`}
                      >
                        {f.name?.charAt(0)}
                      </div>

                      {isSelected && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[8px] border border-white">
                          <i className="fa-solid fa-check"></i>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-medium">{f.name}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 🚀 BUTTON */}
          {selected.length > 0 && (
            <div className="absolute bottom-5 right-5">
              <button
                onClick={handleAddMembers}
                disabled={adding}
                className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg text-xl"
              >
                {adding ? (
                  <i className="fa-solid fa-spinner animate-spin"></i>
                ) : (
                  <i className="fa-solid fa-check"></i>
                )}
              </button>
            </div>
          )}

          {/* 🔥 OVERLAY LOADER */}
          {adding && (
            <motion.div
              className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col gap-3 p-4 z-[10]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-300 rounded-full" />
                  <div className="h-3 w-24 bg-gray-300 rounded" />
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}