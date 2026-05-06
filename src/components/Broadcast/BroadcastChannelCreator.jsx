import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Theme } from "../../theme/globalTheme";
import { useTour } from "../../context/TourContext";

export default function BroadcastChannelCreator({ onClose }) {
    const [selected, setSelected] = useState([]);
    const [friends, setFriends] = useState([]);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const { showTourPrompt, closeTourPrompt, startTourByType, resetSteps, registerStep, startTour } = useTour();
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();


    //   useEffect(() => {
    //   resetSteps();

    //   registerStep({
    //     element: "#BroadcastModal",
    //     popover: {
    //       title: "Broadcast Panel",
    //       description: "Create and manage your broadcast messages here 📢",
    //     }
    //   })

    //   registerStep({
    //     element: "#broadcastInoput",
    //     popover: {
    //       title: "Name Broadcast",
    //       description: "Enter a meaningful name for your broadcast ✏️",
    //     }
    //   })

    //   registerStep({
    //     element: "#Friendslist",
    //     popover: {
    //       title: "Select as many Friends",
    //       description: "Choose friends to include in your broadcast 👥",
    //     }
    //   })

    //   registerStep({
    //     element: "#CreateBroadcastButton",
    //     popover: {
    //       title: "🚀 Make Broadcast",
    //       description: "Create your broadcast and start sharing instantly 📢⚡",
    //     }
    //   })

    //   startTour();
    // }, [])
    const toggleUser = (id) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

   useEffect(() => {
  setLoadingFriends(true);

  fetch(`${import.meta.env.VITE_BACK_DEV_API}/chats`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      setFriends(data?.friends || []);
    })
    .catch(() => setFriends([]))
    .finally(() => setLoadingFriends(false));
}, []);

    // 🚀 create broadcast
    const handleCreate = async () => {
        if (selected.length === 0) return;

        setLoading(true);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACK_DEV_API}/broadcast-channel`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        selectedUsers: selected,
                        name, // 🔥 custom name
                    }),
                }
            );

            const data = await res.json();

            if (res.ok) {
                // 🔥 smooth navigation (NO reload)
                navigate(`/chats?Id=${data.channel._id}`);

                onClose && onClose();
            }
        } catch (err) {
            console.log("Create failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="sticky top-0 z-50 bg-white shadow-sm flex items-center justify-between px-4 py-3">
                <img src={'/logo.svg'} className="w-24 sm:w-28" />
                <h2 className="text-base sm:text-lg font-semibold">Broadcast</h2>

                <div className="flex items-center gap-3">
                    <i
                        className="fa-solid fa-magnifying-glass cursor-pointer text-gray-600"
                        onClick={() => setShowSearch((prev) => !prev)}
                    ></i>

                    <button
                        onClick={() => navigate("/chats")}
                        className="text-xl text-gray-600"
                    >
                        ✕
                    </button>
                </div>
            </header>

     <main className="flex-1 overflow-y-auto bg-gray-50 pb-20">

  <div className="sticky top-0 z-20 bg-white border-b">

  {/* 🔍 SEARCH BAR */}
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

      {/* ❌ CLEAR BUTTON */}
      {search && (
        <button
          onClick={() => setSearch("")}
          className="text-gray-400 text-xs ml-2"
        >
          ✕
        </button>
      )}
    </div>
  </div>

  {/* ⚡ ACTION BAR */}
  <div className="flex items-center justify-between px-3 pb-2">

    {/* SELECT ALL */}
    <button
      onClick={() => {
        if (selected.length === friends.length) {
          setSelected([]);
        } else {
          setSelected(friends.map(f => f._id));
        }
      }}
      className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium active:scale-95 transition"
    >
      <i className="fa-solid fa-check-double text-[10px]" />
      {selected.length === friends.length ? "Unselect" : "Select All"}
    </button>

    {/* COUNT BADGE */}
    <div className="flex items-center gap-2 text-xs text-gray-500">

      {selected.length > 0 && (
        <span className="bg-blue-500 text-white px-2 py-[2px] rounded-full text-[10px]">
          {selected.length}
        </span>
      )}

      <span>
        {selected.length === 0 ? "No selection" : "Selected"}
      </span>

    </div>

  </div>

</div>
  

  {/* ✅ SELECTED USERS (FLOATING LIKE WHATSAPP) */}
  {selected.length > 0 && (
    <div className="sticky top-[52px] z-10 bg-white border-b px-3 py-2">

      {/* COUNT */}
      <div className="text-xs text-gray-500 mb-1">
        {selected.length} selected
      </div>

      {/* AVATARS */}
      <div className="flex gap-3 overflow-x-auto">
        {selected.map((id) => {
          const user = friends.find((f) => f._id === id);

          return (
            <div key={id} className="relative min-w-[60px] text-center">

              {/* AVATAR */}
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                {user?.name?.charAt(0)}
              </div>

              {/* REMOVE (X like WhatsApp) */}
              <div
                onClick={() => toggleUser(id)}
                className="absolute top-0 right-2 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
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

  {/* 👥 LIST */}
  <div className="flex flex-col">

    {loadingFriends ? (
      [...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-12 h-12 rounded-full bg-gray-300 animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-300 rounded w-1/2 animate-pulse" />
            <div className="h-2 bg-gray-200 rounded w-1/3 animate-pulse" />
          </div>
        </div>
      ))
    ) : (
      friends
        .filter((f) =>
          f.name.toLowerCase().includes(search.toLowerCase())
        )
        .map((f) => {
          const isSelected = selected.includes(f._id);

          return (
            <div
              key={f._id}
              onClick={() => toggleUser(f._id)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition active:bg-gray-200 ${
                isSelected ? "bg-blue-50" : ""
              }`}
            >

              {/* AVATAR + CHECK OVERLAY */}
              <div className="relative">

                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                    isSelected ? "bg-blue-400" : "bg-gray-400"
                  }`}
                >
                  {f.name?.charAt(0)}
                </div>

                {/* CHECK (OVERLAY LIKE WHATSAPP) */}
                {isSelected && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] border-2 border-white">
                    <i className="fa-solid fa-check"></i>
                  </div>
                )}
              </div>

              {/* NAME + SUBTEXT */}
              <div className="flex-1">
                <div className="text-sm font-medium">{f.name}</div>
                <div className="text-xs text-gray-400">
                  Tap to select
                </div>
              </div>

            </div>
          );
        })
    )}
  </div>
</main>

{selected.length > 0 && (
  <div className="fixed bottom-6 right-6 z-50">

    <button
      onClick={handleCreate}
      disabled={loading}
      className="w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center text-xl"
    >
      {loading ? (
        <i className="fa-solid fa-spinner animate-spin"></i>
      ) : (
        <i className="fa-solid fa-arrow-right"></i>
      )}
    </button>

  </div>
)}

            <footer className="fixed bottom-0 w-full bg-white border-t py-2 text-center text-xs text-gray-500">
                Broadcast • Meetup
            </footer>
        </div>
    );
}