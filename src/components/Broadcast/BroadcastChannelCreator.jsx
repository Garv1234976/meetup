import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Theme } from "../../theme/globalTheme";

export default function BroadcastChannelCreator({ onClose }) {
    const [selected, setSelected] = useState([]);
    const [friends, setFriends] = useState([]);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const toggleUser = (id) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    // 🔥 fetch friends
    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACK_DEV_API}/chats`, {
            method: "GET",
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                const onlyFriends = data?.friends || [];
                setFriends(onlyFriends);
            })
            .catch(() => {
                setFriends([]);
            });
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
        <AnimatePresence>
            <motion.div
                // className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]"
                className="fixed inset-0 flex justify-center items-center z-[999]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{background: Theme.primaryBackgroundColor}}
            >
                <motion.div
                    className=" w-[350px] rounded-2xl p-5 shadow-xl flex flex-col gap-4"
                    initial={{ scale: 0.8, y: 40 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 40 }}
                    style={{background: Theme.thirdBackgroundColor}}
                >

                    {/* HEADER */}
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg">New Broadcast</h2>
                        <button onClick={() => navigate('/chats')} className="bg-red-500 px-3  rounded-md cursor-pointer">
                            <i className="fa-solid fa-xmark text-white font-semibold"></i>
                        </button>
                    </div>

                    {/* NAME INPUT */}
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border p-2 rounded-md text-sm"
                        placeholder="Broadcast Name"
                    />

                    {/* FRIEND LIST */}
                    <div className="max-h-60 overflow-y-auto flex flex-col gap-2 bg-gray-300 rounded-lg">
                        
                        {friends.map((f) => (
                            <motion.div
                                key={f._id}
                                onClick={() => toggleUser(f._id)}
                                whileTap={{ scale: 0.97 }}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${selected.includes(f._id)
                                        ? "bg-blue-100"
                                        : "hover:bg-gray-100"
                                    }`}
                            >
                                {/* avatar fallback */}
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                                    {f.name?.charAt(0)}
                                </div>

                                <span className="text-sm">{f.name}</span>

                                {selected.includes(f._id) && (
                                    <i className="fa-solid fa-check ml-auto text-blue-500"></i>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* CREATE BUTTON */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreate}
                        disabled={loading || selected.length === 0}
                        className={`p-2 rounded-md text-white ${loading || selected.length === 0
                                ? "bg-gray-400"
                                : "bg-blue-500 hover:bg-blue-600"
                            }`}
                    >
                        {loading ? "Creating..." : "Create Broadcast"}
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}