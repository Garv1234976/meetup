import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "/logo.svg";
import { Theme } from "../../theme/globalTheme";
import { useAuth } from "../../context/AuthContex";

export default function FriendInvitation() {
    // const {curruser} = useAuth();
    const [searchParams] = useSearchParams();
    // const code = searchParams.get("invitecode");
    const dataParam = searchParams.get("invitecode");
    const [actionLoading, setActionLoading] = useState(null);
    const [currUser, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [oldRequests, setOldRequests] = useState([]);
    const [inviteCode, setCode] = useState(null);
    const navigate = useNavigate();
    const [isExpired, setIsExpired] = useState(false);
    const API = import.meta.env.VITE_BACK_DEV_API;

    // 🔹 fetch preview

    let code = null;
    useEffect(() => {
        if (!dataParam) return;

        try {
            const decoded = JSON.parse(atob(dataParam));

            if (decoded.secret !== "monkey123") {
                throw new Error("Invalid");
            }

            setCode(decoded.code);

            // 🔥 check immediately
            if (Date.now() > decoded.exp) {
                setIsExpired(true);
                return;
            }

            // 🔥 AUTO EXPIRE AFTER TIME
            const timeout = decoded.exp - Date.now();

            const timer = setTimeout(() => {
                setIsExpired(true);
            }, timeout);

            return () => clearTimeout(timer);

        } catch (err) {
            setIsExpired(true);
        }
    }, [dataParam]);

    useEffect(() => {
        if (!inviteCode || isExpired) return;

        fetch(`${API}/friend/preview/${inviteCode}`)
            .then((res) => res.json())
            .then((data) => {
                setUser(data.user);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [inviteCode, isExpired]);

    // 🔹 fetch old requests (dummy endpoint, adjust backend)
    useEffect(() => {
        fetch(`${API}/friend/old-requests`)
            .then((res) => res.json())
            .then((data) => setOldRequests(data || []))
            .catch(() => { });
    }, []);

    const handleAccept = () => {
        setActionLoading("accept");
        window.location.href = `${API}/friend/action/${inviteCode}?action=accept`;
    };

    const handleDecline = () => {
        setActionLoading("decline");
        window.location.href = `${API}/friend/action/${inviteCode}?action=decline`;
    };

    if (!dataParam) return <p className="text-center mt-10">Invalid link</p>;
    if (loading && !isExpired) return <p className="text-center mt-10">Loading...</p>;
    if (!currUser && !isExpired) return <p className="text-center mt-10">User not found</p>;
    if (isExpired) {
        return (
             <div className="flex flex-1 h-screen items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-md text-center w-[320px]">

        <div className="text-4xl mb-3">⛔</div>

        <h2 className="text-lg font-bold text-red-500">
          Invite Expired
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          This Friend Request link has expired.  
          Ask Friend for a new Request.
        </p>

        <button
          onClick={() => navigate("/chats")}
          className="mt-5 w-full bg-blue-500 text-white py-2 rounded-md"
        >
          Go to Chats
        </button>

      </div>
    </div>
        );
    }
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">

            {/* 🔹 Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white shadow">
                <img className="w-32" src={Logo} alt="logo" />

                {/* ❌ Back button */}
                <button
                    onClick={() => navigate("/chats")}
                    className="cursor-pointer text-xl font-bold text-gray-600 hover:text-black"
                >
                    ✕
                </button>
            </header>


            {/* 🔹 Body */}
            <div className="flex flex-1" style={{ background: Theme.primaryBackgroundColor }}>


                {/* 🔹 Main Content */}
                <main className=" flex flex-1 items-center justify-center">
                    <div className="w-60 bg-white p-6 rounded-xl shadow-md sm:w-[350px] text-center">

                        {/* Profile */}
                        <img
                            src={currUser.picture}
                            onError={(e) => (e.target.src = "/m.svg")}
                            className="w-20 h-20 rounded-full mx-auto mb-4"
                        />

                        <h2 className="text-xl font-bold">{currUser.name}</h2>

                        <p className="text-sm text-gray-500 mt-1">
                            wants to connect with you
                        </p>

                        <div className="">

                        <div className="flex gap-3 mt-5">
                            {/* Decline */}
                            <button
                                onClick={handleDecline}
                                disabled={actionLoading !== null}
                                className="cursor-pointer w-1/2 bg-gray-300 py-2 rounded-md flex items-center justify-center"
                            >
                                {actionLoading === "decline" ? (
                                    <span className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></span>
                                ) : (
                                    "Decline"
                                )}
                            </button>

                            {/* Accept */}
                            <button
                                onClick={handleAccept}
                                disabled={actionLoading !== null}
                                className="cursor-pointer w-1/2 bg-blue-500 text-white py-2 rounded-md flex items-center justify-center"
                            >
                                {actionLoading === "accept" ? (
                                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                ) : (
                                    "Accept"
                                )}
                            </button>
                        </div>
                        <div className="mt-4 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                        <span>⏳</span>
                        <span className="font-semibold">This invite link will expire in 1 hour</span>
                        </div>
                        </div>
                    </div>
                </main>
                
            </div>

            {/* 🔹 Footer */}
            <footer className="bg-white text-center py-3 text-sm text-gray-500 border-t">
                © {new Date().getFullYear()} Meetup App • All rights reserved
            </footer>
        </div>
    );
}