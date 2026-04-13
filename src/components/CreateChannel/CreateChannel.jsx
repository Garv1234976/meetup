import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import People from "/public/people.json";
import { Theme } from "../../theme/globalTheme";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


export function CreateChannel({ token }) {
    const [showForm, setShowForm] = useState(false);
    const [isWiping, setIsWiping] = useState(false);
    const [friends, setFriends] = useState([]);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [channelName, setChannelName] = useState("");
    const [description, setDescription] = useState("");
    const [created, setCreated] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    //  WIPE TRANSITION
    const navigate = useNavigate();
    const handleCreateStart = () => {
        setIsWiping(true);

        setTimeout(() => {
            setShowForm(true);
        }, 250);

        setTimeout(() => {
            setIsWiping(false);
        }, 500);
    };

    //  IMAGE UPLOAD
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    //  FINAL CREATE
    const handleSubmit = () => {
        if (!channelName.trim()) {
            alert("Channel name is required");
            return;
        }

        setCreated(true);
    };

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACK_DEV_API}/chats`, {
            method: "GET",
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                const friends = data?.friends;
                if (friends) {
                    setFriends(friends);
                } else {
                    setFriends([]);
                }
            })
            .catch((err) => {
                console.log("Failed to fetch Friends", err);
            });
    }, []);

    const toggleFriend = (id) => {
        setSelectedFriends((prev) =>
            prev.includes(id)
                ? prev.filter((f) => f !== id)
                : [...prev, id]
        );
    };


    const filteredFriends = friends.filter((f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const selectAll = () => {
        const filteredIds = filteredFriends.map((f) => f._id);

        const allSelected = filteredIds.every((id) =>
            selectedFriends.includes(id)
        );

        if (allSelected) {
            setSelectedFriends((prev) =>
                prev.filter((id) => !filteredIds.includes(id))
            );
        } else {
            setSelectedFriends((prev) => [
                ...new Set([...prev, ...filteredIds]),
            ]);
        }
    };
    // const handleAddMembers = () => {
    //     if (!selectedFriends.length) {
    //         alert("Select at least one friend");
    //         return;
    //     }

    //     setIsCreating(true);

    //     // simulate process
    //     setTimeout(() => {
    //         navigate("/chats");
    //     }, 2500);
    // };

    const handleAddMembers = async () => {
        if (!selectedFriends.length) {
            alert("Select at least one friend");
            return;
        }

        try {
            setIsCreating(true);

            const res = await fetch(
                `${import.meta.env.VITE_BACK_DEV_API}/createChannel`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: channelName,
                        description,
                        selectedFriends,
                    }),
                }
            );

            if (!res.ok) throw new Error();

            const data = await res.json();

            // optional: use returned channel
            console.log("Created channel:", data.channel);

            setTimeout(() => {
                navigate("/chats");
            }, 2500);

        } catch (err) {
            console.error("Channel create failed", err);
        }
    };
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="h-screen flex items-center justify-center relative overflow-hidden"
                style={{ background: Theme.thirdBackgroundColor }}
            >
                {/* ================= WIPE OVERLAY ================= */}
                <AnimatePresence>
                    {isWiping && (
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "0%" }}
                            exit={{ x: "100%" }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="absolute inset-0 z-50"
                            style={{ background: Theme.thirdBackgroundColor }}
                        />
                    )}
                </AnimatePresence>

                {/* ================= MAIN CONTENT ================= */}
                {!created ? (
                    <div className="flex flex-col items-center gap-4">
                        {!showForm ? (
                            <>
                                {/* INTRO */}
                                <Lottie style={{ width: 500 }} animationData={People} loop />

                                <h2 className="text-xl font-semibold">
                                    What is a Channel ?
                                </h2>

                                <p className="text-sm text-gray-600 text-center max-w-[400px]">
                                    Channel are a one-to-many tool for broadcasting your message to unlimited audience
                                </p>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCreateStart}
                                    className="relative overflow-hidden px-8 py-2 rounded-xl text-white font-medium bg-[#26d7a8]"
                                >
                                    Create Channel
                                    <span className="absolute inset-0">
                                        <span className="shine"></span>
                                    </span>
                                </motion.button>
                            </>
                        ) : (
                            /* ================= FORM ================= */
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-5 w-[350px]"
                            >
                                <span className="text-lg font-semibold">
                                    New Channel
                                </span>

                                {/* IMAGE */}
                                <label className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <i className="fa-solid fa-camera text-gray-600"></i>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>

                                {/* INPUTS */}
                                <div className="w-full flex flex-col gap-3">
                                    <input
                                        type="text"
                                        placeholder="Channel name"
                                        value={channelName}
                                        onChange={(e) => setChannelName(e.target.value)}
                                        className="px-3 py-2 border rounded-md outline-none focus:border-blue-400"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="px-3 py-2 border rounded-md outline-none focus:border-blue-400"
                                    />
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSubmit}
                                    className="w-full bg-[#26d7a8] text-white py-2 rounded-md"
                                >
                                    Create Channel
                                </motion.button>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    /* ================= CHANNEL VIEW ================= */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {/* HEADER */}
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center gap-3"
                        >
                            <img
                                src={preview}
                                className="w-20 h-20 rounded-full object-cover"
                            />
                            <div>
                                <h1 className="font-semibold text-xl">{channelName}</h1>
                                <p className="text-sm text-gray-500">{description}</p>
                            </div>
                        </motion.div>

                        {/* CONTENT */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6"
                        >
                            <p className="text-lg text-gray-600 flex items-center gap-3 py-3">
                                <i className="fa-solid fa-users"></i> Your friends will appear here
                            </p>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <div className="flex flex-col gap-2">

                                    <input
                                        type="text"
                                        placeholder="Search friends..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="px-3 py-2 rounded-md border border-gray-300 outline-none focus:border-blue-400 text-sm"
                                    />
                                    {/* SELECT ALL */}
                                    <div className="flex items-center gap-2 mb-2 py-3">
                                        <input
                                            type="checkbox"
                                            checked={
                                                filteredFriends.length > 0 &&
                                                filteredFriends.every((f) => selectedFriends.includes(f._id))
                                            }
                                            onChange={selectAll}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-lg font-medium ">
                                            Select All ({filteredFriends.length})
                                        </span>
                                    </div>

                                    <div className="h-100  overflow-y-scroll px-2" style={{ scrollbarWidth: 'none' }}>

                                        {filteredFriends.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-2">
                                                No friends found
                                            </p>
                                        ) : (
                                            filteredFriends.map((f) => (
                                                <div
                                                    key={f._id}
                                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition  mb-2"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFriends.includes(f._id)}
                                                        onChange={() => toggleFriend(f._id)}
                                                        className="w-4 h-4"
                                                    />

                                                    <img
                                                        src={f.picture}
                                                        className="w-13 h-13 rounded-full"
                                                    />

                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{f.name}</span>
                                                        <span className="text-xs text-gray-500">{f.email}</span>
                                                    </div>
                                                </div>
                                            )))
                                        }
                                    </div>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAddMembers}
                                    className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md font-medium"
                                >
                                    Add Members
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </motion.div>
            {isCreating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center z-[100]"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 40 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 40 }}
                        className="bg-white p-6 rounded-2xl flex flex-col items-center gap-4 shadow-xl"
                    >
                        {/*  AVATAR SLIDER */}
                        <div className="flex items-center">
                            {friends
                                .filter((f) => selectedFriends.includes(f._id))
                                .slice(0, 10)
                                .map((user, i) => (
                                    <motion.img
                                        key={user._id}
                                        src={user.picture}
                                        className="-ml-3 first:ml-0 w-10 h-10 rounded-full border-2 border-white"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                    />
                                ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2"
                        >
                            {/* optional preview image */}
                            {preview && (
                                <img
                                    src={preview}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            )}

                            <span className="text-sm font-semibold text-gray-800">
                                {channelName}
                            </span>
                        </motion.div>
                        {/* SLIDER TEXT */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm font-medium text-gray-700"
                        >
                            Creating Channel...
                        </motion.div>

                        {/*  PROGRESS BAR */}
                        <motion.div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2 }}
                                className="h-full bg-[#26d7a8]"
                            />
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}