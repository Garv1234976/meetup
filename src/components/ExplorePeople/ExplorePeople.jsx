import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "/logo.svg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContex";
import { useTour } from "../../context/TourContext";

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
    const [activeTab, setActiveTab] = useState("popular");
    const [trendingUsers, setTrendingUsers] = useState([]);
    const [popularChannels, setPopularChannels] = useState([]);
    // const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [joinedChannels, setJoinedChannels] = useState([]);
    // const [requested, setRequested] = useState({});
    const [suggestedChannels, setSuggestedChannels] = useState([]);
    const { showTourPrompt, closeTourPrompt, startTourByType, resetSteps, registerStep, startTour } = useTour();

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
                setTrendingUsers(data.trendingUsers || []);
                setPopularChannels(data.popularChannel || []);
                setJoinedChannels(data.joinedChannels || []);
                setSuggestedChannels(data.suggestedChannels || []);
            } catch (err) {
                console.error("Explore fetch failed", err);
            } finally {
                setLoading(false);
            }
        }

        fetchExplore();
    }, []);

    const joinChannel = async (channel) => {
        try {

            // 🔥 instant UI update
            setJoinedChannels((prev) => [
                ...prev,
                channel._id
            ]);

            setPopularChannels((prev) =>
                prev.map((c) =>
                    c._id === channel._id
                        ? {
                            ...c,
                            totalSubscribers:
                                c.totalSubscribers + 1
                        }
                        : c
                )
            );

            const res = await fetch(
                `${import.meta.env.VITE_BACK_DEV_API}/join/${channel.inviteCode}`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                throw new Error();
            }

            // 🔥 refresh api/me
            const me = await fetch(
                `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
                {
                    credentials: "include",
                }
            );

            const userData = await me.json();

            setUser(userData.user);

        } catch (err) {

            // rollback if failed
            setJoinedChannels((prev) =>
                prev.filter((id) => id !== channel._id)
            );

            console.log("Join failed");
        }
    };
    // useEffect(() => {
    //     resetSteps();
    //     registerStep({
    //         element: "#gamer",
    //         popover: {
    //             title: "Popular People ⭐",
    //             description: "Explore popular profiles on Meetup and send friend requests to connect instantly 🤝.",
    //         },
    //     });
    //     registerStep({
    //         element: "#Normaluser",
    //         popover: {
    //             title: "Trending Profile",
    //             description: "Daily active user 🚀",
    //         },
    //     });
    //      registerStep({
    //          element: "#gamer",
    //          popover: {
    //              title: "Popular People ⭐",
    //              description: "Explore popular profiles on Meetup and send friend requests to connect instantly 🤝.",
    //          },
    //      });
    //      registerStep({
    //          element: "#Normaluser",
    //          popover: {
    //              title: "Popular Channel ⭐",
    //              description: "Explore popular Channel on Meetup and join instantly 🤝.",
    //          },
    //      });
    //     startTour();
    // })
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
                    <div

                        className="mt-3 ">
                        <div id="gamer" className="
    flex items-center gap-2
    overflow-x-auto no-scrollbar
    pb-2 px-1
">

                            {[
                                {
                                    key: "popular",
                                    label: "🔥 Popular"
                                },
                                {
                                    key: "trending",
                                    label: "⭐ Trending"
                                },
                                {
                                    key: "channels",
                                    label: "📢 Channels"
                                }
                            ].map((tab) => (

                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`
                whitespace-nowrap
                px-4 py-2 rounded-full
                text-xs sm:text-sm
                font-medium transition-all

                ${activeTab === tab.key
                                            ? "bg-blue-500 text-white shadow-md"
                                            : "bg-gray-100 text-gray-600"
                                        }
            `}
                                >
                                    {tab.label}
                                </button>

                            ))}

                        </div>

                        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
                            {/* 🔥 TAB CONTENT */}
                            <div className="mt-3">

                                {/* 🔥 POPULAR */}
                                {activeTab === "popular" && (

                                    <div className="
            flex gap-3 sm:gap-4
            overflow-x-auto pb-2
            no-scrollbar
        ">

                                        {loading
                                            ? Array.from({ length: 6 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="
                            flex flex-col items-center
                            min-w-[80px] animate-pulse
                        "
                                                >
                                                    <div className="
                            w-14 h-14 rounded-full
                            bg-gray-200
                        " />

                                                    <div className="
                            w-12 h-3 mt-2 rounded
                            bg-gray-200
                        " />
                                                </div>
                                            ))
                                            : popularUsers.map((user) => (

                                                <motion.div
                                                    key={user._id}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="
                            flex flex-col items-center
                            min-w-[85px]
                        "
                                                >

                                                    <div className="relative">

                                                        <div className="
                                p-[2px]
                                rounded-full
                                bg-gradient-to-tr
                                from-blue-500
                                to-purple-500
                            ">

                                                            <img
                                                                src={user.picture}
                                                                className="
                                        w-16 h-16 rounded-full
                                        border-2 border-white
                                        object-cover
                                    "
                                                                onError={(e) => e.target.src = "/m.svg"}
                                                            />

                                                        </div>

                                                        <div className="
                                absolute top-0 -right-1
                                bg-yellow-400
                                text-white text-[10px]
                                w-5 h-5 rounded-full
                                flex items-center justify-center
                            ">
                                                            ⭐
                                                        </div>

                                                    </div>

                                                    <p className="
                            text-[11px]
                            mt-2 text-center
                            truncate w-[75px]
                        ">
                                                        {user.name}
                                                    </p>

                                                </motion.div>

                                            ))}
                                    </div>

                                )}

                                {/* 🔥 TRENDING */}
                                {activeTab === "trending" && (

                                    <div id="Normaluser" className="
            flex gap-3 overflow-x-auto
            pb-2 no-scrollbar
        ">

                                        {trendingUsers.map((d, i) => (

                                            <motion.div
                                                key={i}
                                                whileTap={{ scale: 0.95 }}
                                                className="
                        min-w-[140px]
                        bg-white rounded-2xl
                        shadow-sm border p-3
                        relative
                    "
                                            >

                                                {d.isStar && (
                                                    <div className="
                            absolute top-2 right-2
                            bg-yellow-400 text-white
                            text-[10px]
                            px-1.5 py-0.5 rounded-full
                        ">
                                                        ⭐
                                                    </div>
                                                )}

                                                <div className="
                        flex flex-col items-center
                    ">

                                                    <div className="
                            p-[2px]
                            rounded-full
                            bg-gradient-to-tr
                            from-pink-500
                            via-purple-500
                            to-blue-500
                        ">

                                                        <img
                                                            src={d.picture}
                                                            alt={d.name}
                                                            onError={(e) => e.target.src = '/m.svg'}
                                                            className="
                                    w-16 h-16 rounded-full
                                    object-cover border-2 border-white
                                "
                                                        />

                                                    </div>

                                                    <h4 className="
                            mt-2 text-sm font-semibold
                            text-center line-clamp-1
                        ">
                                                        {d.name}
                                                    </h4>

                                                    {d.mutualFriends > 0 && (
                                                        <p className="
                                text-[11px]
                                text-gray-500 mt-1
                            ">
                                                            👥 {d.mutualFriends} mutual
                                                        </p>
                                                    )}

                                                    {/* <motion.button
                                                        whileTap={{ scale: 0.92 }}
                                                        onClick={() => sendRequest(d.inviteNumber)}
                                                        className={`
                                mt-3 w-full py-2 rounded-xl
                                text-xs font-semibold

                                ${requested.includes(d._id)
                                                                ? "bg-gray-200 text-gray-700"
                                                                : "bg-blue-500 text-white"
                                                            }
                            `}
                                                    >
                                                        {requested.includes(d._id)
                                                            ? "Requested"
                                                            : "Add Friend"}
                                                    </motion.button> */}

                                                </div>

                                            </motion.div>

                                        ))}

                                    </div>

                                )}

                                {/* 🔥 CHANNELS */}
                                {activeTab === "channels" && (

                                    <div id="Normaluser" className="
            flex gap-3 overflow-x-auto
            pb-2 no-scrollbar
        ">

                                        {popularChannels.map((channel) => (

                                            <motion.div
                                                key={channel._id}
                                                whileTap={{ scale: 0.96 }}
                                                className="
                        min-w-[230px]
                        rounded-2xl p-4
                        bg-gradient-to-br
                        from-blue-500 to-indigo-600
                        text-white shadow-lg
                    "
                                            >

                                                <div className="
                        flex items-center gap-3
                    ">

                                                    <img
                                                        src={channel.creatorPicture}
                                                        className="
                                w-12 h-12 rounded-full
                                border-2 border-white
                                object-cover
                            "
                                                        onError={(e) => e.target.src = "/m.svg"}
                                                    />

                                                    <div className="min-w-0">

                                                        <h4 className="
                                font-semibold text-sm
                                line-clamp-1
                            ">
                                                            {channel.name}
                                                        </h4>

                                                        <p className="
                                text-[11px]
                                text-white/80 line-clamp-1
                            ">
                                                            by {channel.creatorName}
                                                        </p>

                                                    </div>

                                                </div>

                                                <div className="
                        mt-4 flex items-center justify-between
                    ">

                                                    <div>

                                                        <p className="
                                text-lg font-bold
                            ">
                                                            {channel.totalSubscribers}
                                                        </p>

                                                        <p className="
                                text-[11px]
                                text-white/80
                            ">
                                                            subscribers
                                                        </p>

                                                    </div>

                                                    <motion.button
                                                        whileTap={{ scale: 0.92 }}
                                                        disabled={joinedChannels.includes(channel._id)}
                                                        onClick={() => joinChannel(channel)}
                                                        className={`
        px-4 py-2 rounded-xl
        text-xs font-semibold
        transition-all

        ${joinedChannels.includes(channel._id)
                                                                ? "bg-green-500 text-white"
                                                                : "bg-white text-blue-600"
                                                            }
    `}
                                                    >
                                                        {joinedChannels.includes(channel._id)
                                                            ? "Joined"
                                                            : "Join"}
                                                    </motion.button>

                                                </div>

                                            </motion.div>

                                        ))}

                                    </div>

                                )}

                            </div>
                        </div>
                    </div>

                    {/* 🔥 SUGGESTIONS */}
                    {activeTab == "channels" && (
                        <div className="mt-5">

                            <h3 className="
        text-sm sm:text-base
        font-semibold mb-3 px-1
    ">
                                Suggested Channels
                            </h3>

                            <div className="
        grid grid-cols-1
        sm:grid-cols-2
        gap-3
    ">

                                {suggestedChannels.map((channel) => (

                                    <motion.div
                                        key={channel._id}
                                        whileHover={{ y: -2 }}
                                        className="
                    bg-white rounded-2xl
                    shadow-sm border
                    p-3 flex items-center
                    justify-between
                "
                                    >

                                        <div className="
                    flex items-center gap-3
                    min-w-0
                ">

                                            <img
                                                src={channel.creatorPicture}
                                                className="
                            w-12 h-12 rounded-full
                            object-cover
                        "
                                                onError={(e) =>
                                                    e.target.src = "/m.svg"
                                                }
                                            />

                                            <div className="min-w-0">

                                                <h4 className="
                            text-sm font-semibold
                            line-clamp-1
                        ">
                                                    {channel.name}
                                                </h4>

                                                <p className="
                            text-xs text-gray-500
                            line-clamp-1
                        ">
                                                    by {channel.creatorName}
                                                </p>

                                                <p className="
                            text-[11px]
                            text-blue-500 mt-1
                        ">
                                                    👥 {channel.totalSubscribers} subscribers
                                                </p>

                                            </div>

                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 0.92 }}
                                            disabled={joinedChannels.includes(channel._id)}
                                            onClick={() => joinChannel(channel)}
                                            className={`
                        text-xs font-semibold
                        px-4 py-2 rounded-full
                        transition-all

                        ${joinedChannels.includes(channel._id)
                                                    ? "bg-green-500 text-white"
                                                    : "bg-blue-500 text-white"
                                                }
                    `}
                                        >
                                            {joinedChannels.includes(channel._id)
                                                ? "Joined"
                                                : "Join"}
                                        </motion.button>

                                    </motion.div>

                                ))}

                            </div>

                        </div>
                    )}
                    <div

                        className="mt-5">
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
                                                <p className="text-sm sm:text-base font-semibold line-clamp-1">
                                                    {user.name}
                                                </p>
                                                {/* <p className="text-xs text-gray-400">
                                                    {user.followersCount ?? user.friends?.length ?? 0} followers
                                                </p> */}
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