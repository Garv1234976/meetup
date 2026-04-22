import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
console.log("Dom Loaded")
export default function JoinChannelOverview() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("channelInvitecode"); 
  console.log(code);
  
  const navigate = useNavigate();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const API = import.meta.env.VITE_BACK_DEV_API;

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

  if (!code) return <p className="text-center mt-10">Invalid link</p>;
  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!channel) return <p className="text-center mt-10">Invalid invite link</p>;

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-[350px] text-center">

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

        <button
          onClick={handleJoin}
          disabled={joining}
          className="mt-5 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          {joining ? "Joining..." : "Join Channel"}
        </button>

      </div>
    </div>
  );
}