import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Theme } from "../../theme/globalTheme";

export default function JoinChannelOverview() {
  const [searchParams] = useSearchParams();
  const dataParam = searchParams.get("channelInvitecode");

  const navigate = useNavigate();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const API = import.meta.env.VITE_BACK_DEV_API;


  const [code, setCode] = useState(null);
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

  // 🔹 fetch preview
  useEffect(() => {
    if (!code) return; // 🔥 prevent empty call

    fetch(`${API}/channel/preview/${code}`)
      .then(res => res.json())
      .then(data => {
        setChannel(data.channel);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [code]);

  // 🔹 join channel
  const handleJoin = async () => {
    try {
      setJoining(true);

      const res = await fetch(`${API}/join/${code}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        alert("Join failed");
        return;
      }

      navigate("/chats");

    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  if (!dataParam) {
    return <p className="text-center mt-10">Invalid link</p>;
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow-md text-center w-[320px]">

          <div className="text-4xl mb-3">⛔</div>

          <h2 className="text-lg font-bold text-red-500">
            Invite Expired
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            This channel invite link has expired.
            Ask admin for a new invite.
          </p>

          <button
            onClick={() => navigate("/chats")}
            className="mt-5 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Go to Chats
          </button>

        </div>
      </div>
    );
  }

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (!channel) {
    return <p className="text-center mt-10">Invalid invite link</p>;
  }
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* 🔹 HEADER */}
      <header className="flex items-center justify-between px-4 py-3 bg-white shadow">
        <img className="w-25" src={'/logo.svg'} alt="" />
        <h2 className="font-bold text-lg">Join Channel</h2>

        <button
          onClick={() => navigate("/chats")}
          className="text-xl font-bold text-gray-600 hover:text-black"
        >
          ✕
        </button>
      </header>

      {/* 🔥 EXPIRED UI */}


      {/* 🔹 MAIN BODY */}
      {!isExpired && (
        <div className="flex flex-1 items-center justify-center" style={{background: Theme.primaryBackgroundColor}}>

          <div className="bg-white p-6 rounded-xl shadow-md w-[350px] text-center">

            

            {/* ICON */}
            <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📢</span>
            </div>

            <h2 className="text-xl font-bold">{channel.name}</h2>

            <p className="text-sm text-gray-500 mt-1">
              Created by {channel.creator?.name || "Unknown"}
            </p>

            <p className="text-sm mt-2">
              {channel.totalSubscribers} subscribers
            </p>

            {/* 🔥 JOIN BUTTON */}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="mt-5 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
            >
              {joining ? "Joining..." : "Join Channel"}
            </button>

            {/* 🔥 SHARE BUTTON */}
            <button
              onClick={() => {
                const link = window.location.href;
                navigator.clipboard.writeText(link);

              }}
              className="mt-3 w-full bg-gray-200 py-2 rounded-md hover:bg-gray-300"
            >
              Share Invite
            </button>

            <div className="mt-4 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2 font-semibold">
              ⏳ This invite link will expire in 1 hour
            </div>
          </div>

        </div>
      )}

      {/* 🔹 FOOTER */}
      <footer className="bg-white text-center py-3 text-sm text-gray-500 border-t">
        © {new Date().getFullYear()} Meetup App • Channel Invite
      </footer>

    </div>
  );
}