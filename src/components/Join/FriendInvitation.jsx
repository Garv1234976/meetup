import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function FriendInvitation() {
    const [searchParams] = useSearchParams();
    const code = searchParams.get("invitecode");

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACK_DEV_API;

    // 🔹 fetch preview
    useEffect(() => {
        if (!code) return;

        fetch(`${API}/friend/preview/${code}`)
            .then((res) => res.json())
            .then((data) => {
                setUser(data.user);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [code]);

    const handleAccept = () => {
        window.location.href = `${API}/friend/action/${code}?action=accept`;
    };

    const handleDecline = () => {
        window.location.href = `${API}/friend/action/${code}?action=decline`;
    };

    if (!code) return <p className="text-center mt-10">Invalid link</p>;
    if (loading) return <p className="text-center mt-10">Loading...</p>;
    if (!user) return <p className="text-center mt-10">User not found</p>;

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-xl shadow-md w-[350px] text-center">

                {/* Profile */}
                <img
                    src={user.picture}
                    onError={(e) => (e.target.src = "/m.svg")}
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                />

                <h2 className="text-xl font-bold">{user.name}</h2>

                <p className="text-sm text-gray-500 mt-1">
                    wants to connect with you
                </p>

                {/* Buttons */}
                <div className="flex gap-3 mt-5">
                    <button
                        onClick={handleDecline}
                        className="w-1/2 bg-gray-300 py-2 rounded-md"
                    >
                        Decline
                    </button>

                    <button
                        onClick={handleAccept}
                        className="w-1/2 bg-blue-500 text-white py-2 rounded-md"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}