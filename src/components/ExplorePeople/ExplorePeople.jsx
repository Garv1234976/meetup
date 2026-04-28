import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "/logo.svg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContex";

export function ExplorePeople() {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [popularUsers, setPopularUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    // const [requested, setRequested] = useState({});
    const requested = user?.friendRequestsSent || [];

    useEffect(() => {
        async function fetchExplore() {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACK_DEV_API}/explore`, {
                    credentials: "include",
                });

                const data = await res.json();

                // ✅ FIXED
                setPopularUsers(data.popular || []);
                setUsers(data.users || []);
            } catch (err) {
                console.error("Explore fetch failed", err);
            } finally {
                setLoading(false);
            }
        }

        fetchExplore();
    }, []);

    const sendRequest = async (inviteNumber) => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${inviteNumber}`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error();

            // 🔥 REFRESH USER (IMPORTANT)
            const userRes = await fetch(
                `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
                { credentials: "include" }
            );

            const updated = await userRes.json();
            setUser(updated.user);

        } catch (err) {
            console.error("Request failed");
        }
    };

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delay = setTimeout(async () => {
            try {
                setSearchLoading(true);

                const res = await fetch(
                    `${import.meta.env.VITE_BACK_DEV_API}/search-users?q=${searchQuery}`,
                    { credentials: "include" }
                );

                const data = await res.json();
                setSearchResults(data.users || []);

            } catch (err) {
                console.error("Search failed");
            } finally {
                setSearchLoading(false);
            }
        }, 400); // 🔥 debounce

        return () => clearTimeout(delay);
    }, [searchQuery]);
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            {/* 🔹 HEADER */}
            <header className="sticky top-0 z-50 bg-white shadow-sm flex items-center justify-between px-4 py-3">
                <img src={Logo} className="w-24 sm:w-28" />
                <h2 className="text-base sm:text-lg font-semibold">Explore</h2>

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

            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm"
                    >
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full  px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <i onClick={() => { setSearchQuery(""); setShowSearch((prev) => !prev) }} className="fa-solid fa-xmark"></i>
                    </motion.div>
                )}
            </AnimatePresence>
            {searchQuery && (
                <div className="mt-3 px-2">
                    <h3 className="text-sm font-semibold mb-2 px-1">Search Results</h3>

                    <div className="flex flex-col gap-2">
                        {searchLoading ? (
                            <p className="text-sm text-gray-400 px-1">Searching...</p>
                        ) : searchResults.length === 0 ? (
                            <p className="text-sm text-gray-400 px-1">No users found</p>
                        ) : (
                            searchResults.map((user) => (
                                <motion.div
                                    key={user._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-3 rounded-xl shadow flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={user.picture}
                                            className="w-10 h-10 rounded-full"
                                            onError={(e) => (e.target.src = "/m.svg")}
                                        />
                                        <span className="text-sm font-medium">{user.name}</span>
                                    </div>

                                    <button
                                        onClick={() => sendRequest(user.inviteNumber)}
                                        className={`text-xs px-3 py-1 rounded-full ${requested.includes(user._id)
                                                ? "bg-gray-300"
                                                : "bg-blue-500 text-white"
                                            }`}
                                    >
                                        {requested.includes(user._id) ? "Requested" : "Add Friend"}
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            )}
            {/* 🔹 BODY */}
            <main className="flex-1 overflow-y-auto px-3 sm:px-6 pb-24">
                <div className="max-w-5xl mx-auto">

                    {/* 🔥 POPULAR */}
                    <div className="mt-3">
                        <h3 className="text-sm sm:text-base font-semibold mb-2 px-1">
                            🔥 Popular
                        </h3>

                        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
                            {loading
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col items-center min-w-[80px] sm:min-w-[100px] animate-pulse"
                                    >
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200" />
                                        <div className="w-12 h-3 mt-2 rounded bg-gray-200" />
                                        <div className="w-10 h-3 mt-1 rounded bg-gray-200" />
                                    </div>
                                ))
                                : popularUsers.map((user, i) => (
                                    <motion.div
                                        key={user._id}
                                        // initial={{ opacity: 0, scale: 0.6, x: -40 }}
                                        // animate={{ opacity: 1, scale: 1, x: 0 }}
                                        // transition={{
                                        //     delay: i * 0.04,
                                        //     duration: 0.25,
                                        //     ease: "easeOut",
                                        // }}
                                        className="flex flex-col items-center min-w-[80px] sm:min-w-[100px]"
                                    >
                                        <div className="relative">
                                            <div className="p-[2px] rounded-full bg-gradient-to-tr from-blue-500">
                                                <img
                                                    src={user.picture}
                                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white object-contain"
                                                    onError={(e) => e.target.src = "/m.svg"}
                                                />
                                            </div>

                                            <div className="absolute top-1 -right-1 bg-yellow-400 text-white text-[10px] px-1 rounded-full shadow">
                                                <i className="fa-solid fa-star"></i>
                                            </div>
                                        </div>

                                        <span className="text-[11px] sm:text-xs mt-1 text-center truncate w-[70px] sm:w-[90px]">
                                            {user.name}
                                        </span>

                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => sendRequest(user.inviteNumber, user._id)}
                                            className={`text-xs sm:text-sm px-3 py-1.5 rounded-full ${requested.includes(user._id)
                                                    ? "bg-gray-300 text-black"
                                                    : "bg-blue-500 text-white"
                                                }`}
                                        >
                                            {requested.includes(user._id) ? "Requested" : "Add Friend"}
                                        </motion.button>
                                    </motion.div>
                                ))}
                        </div>
                    </div>

                    {/* 🔥 SUGGESTIONS */}
                    <div className="mt-5">
                        <h3 className="text-sm sm:text-base font-semibold mb-3 px-1">
                            Suggested for you
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {loading
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between animate-pulse"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-200" />
                                            <div>
                                                <div className="w-24 h-3 mb-2 bg-gray-200 rounded" />
                                                <div className="w-16 h-3 bg-gray-200 rounded" />
                                            </div>
                                        </div>

                                        <div className="w-16 h-6 bg-gray-200 rounded-full" />
                                    </div>
                                ))
                                : users.map((user, i) => (
                                    <motion.div
                                        key={user._id}
                                        // initial={{ opacity: 0, x: -20 }}
                                        // animate={{ opacity: 1, x: 0 }}
                                        // transition={{
                                        //     delay: i * 0.05,
                                        //     duration: 0.4,
                                        // }}
                                        className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between hover:shadow-md transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.picture}
                                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full"
                                                onError={(e) => e.target.src = "/m.svg"}
                                            />

                                            <div>
                                                <p className="text-sm sm:text-base font-semibold">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {user.followersCount ?? user.friends?.length ?? 0} followers
                                                </p>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => sendRequest(user.inviteNumber, user._id)}
                                            className={`bg-blue-500 text-white text-xs sm:text-sm px-3 py-1.5 rounded-full ${requested.includes(user._id)
                                                    ? "bg-gray-300 text-black"
                                                    : "bg-blue-500 text-white"
                                                }`}
                                        >
                                            {requested.includes(user._id) ? "Requested" : "Add Friend"}
                                        </motion.button>
                                    </motion.div>
                                ))}
                        </div>
                    </div>

                </div>
            </main>

            {/* 🔹 FOOTER */}
            <footer className="fixed bottom-0 w-full bg-white border-t py-2 text-center text-xs text-gray-500">
                Explore People • Meetup
            </footer>

        </div>

    );
}