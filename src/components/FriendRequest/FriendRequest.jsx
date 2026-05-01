import { useEffect, useState } from "react";
import Logo from "/logo.svg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContex";

export function FriendRequest() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // 🔥 FETCH LATEST USER
  // =========================
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
          { credentials: "include" }
        );

        const data = await res.json();

        setUser(data.user);
        setRequests(data.user.friendRequestsReceived || []);
      } catch (err) {
        console.log("failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // =========================
  // ✅ ACCEPT
  // =========================
  const handleAccept = async (id) => {
    try {
      await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${id}/accept`,
        { method: "POST", credentials: "include" }
      );

      setRequests((prev) => prev.filter((r) => r._id !== id));

      window.dispatchEvent(
        new CustomEvent("friend-added", { detail: id })
      );
    } catch (err) {
      console.log("accept failed");
    }
  };

  // =========================
  // ❌ DECLINE
  // =========================
  const handleDecline = async (id) => {
    try {
      await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${id}/decline`,
        { method: "POST", credentials: "include" }
      );

      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.log("decline failed");
    }
  };

  // =========================
  // ✅ ACCEPT ALL
  // =========================
  // const handleAcceptAll = async () => {
  //   try {
  //     const res = await fetch(
  //       `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/acceptall`,
  //       {
  //         method: "POST",
  //         credentials: "include",
  //       }
  //     );

  //     if (!res.ok) throw new Error();

  //     // 🔥 instant UI
  //     requests.forEach((req) => {
  //       window.dispatchEvent(
  //         new CustomEvent("friend-added", { detail: req })
  //       );
  //     });

  //     setRequests([]);

  //     // 🔥 refresh user
  //     const userRes = await fetch(
  //       `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
  //       { credentials: "include" }
  //     );

  //     const updated = await userRes.json();
  //     setUser(updated.user);
  //   } catch (err) {
  //     console.log("accept all failed");
  //   }
  // };

  // =========================
  // 🔥 DUMMY GROUPING (TEMP)
  // =========================
  const todayRequests = requests.slice(0, 2);
  const olderRequests = requests.slice(2);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white shadow-sm flex items-center justify-between px-4 py-3">
        <img src={Logo} className="w-24" />

        <h2 className="font-semibold text-lg">Friend Requests</h2>

        <div className="flex items-center gap-3">
          {requests.length > 0 && (
            <button
              // onClick={handleAcceptAll}
              className="text-blue-500 text-sm font-medium"
            >
              Accept All
            </button>
          )}

          <button onClick={() => navigate("/chats")}>
            <i className="fa-solid fa-xmark text-xl text-gray-600"></i>
          </button>
        </div>
      </header>

      {/* ================= BODY ================= */}
      <main className="flex-1 overflow-y-auto px-3 pb-24">

        {loading ? (
          <>
            {/* TODAY SKELETON */}
            <p className="text-xs text-gray-400 px-2 mb-2">Today</p>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 mb-2 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="w-24 h-3 bg-gray-200 mb-2 rounded" />
                  <div className="w-16 h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}

            {/* OLDER SKELETON */}
            <p className="text-xs text-gray-400 px-2 mt-4 mb-2">Earlier</p>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 mb-2 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="w-24 h-3 bg-gray-200 mb-2 rounded" />
                  <div className="w-16 h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </>
        ) : requests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-4xl">📭</span>
            <p className="text-sm mt-2">No friend requests</p>
          </div>
        ) : (
          <>
            {/* TODAY */}
            {todayRequests.length > 0 && (
              <>
                <p className="text-xs text-gray-400 px-2 mb-2">Today</p>

                {todayRequests.map((req) => (
                  <RequestCard
                    key={req._id}
                    req={req}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </>
            )}

            {/* OLDER */}
            {olderRequests.length > 0 && (
              <>
                <p className="text-xs text-gray-400 px-2 mt-4 mb-2">Earlier</p>

                {olderRequests.map((req) => (
                  <RequestCard
                    key={req._id}
                    req={req}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </>
            )}
          </>
        )}
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="fixed bottom-0 w-full bg-white border-t py-2 text-center text-xs text-gray-500">
        {requests.length} pending request{requests.length !== 1 && "s"}
      </footer>
    </div>
  );
}

/* =========================
   🔥 REUSABLE CARD
========================= */
function RequestCard({ req, onAccept, onDecline }) {
  return (
    <div className="bg-white rounded-xl p-3 flex items-center justify-between mb-2 shadow-sm">

      {/* LEFT */}
      <div className="flex items-center gap-3">
        <img
          src={req.picture}
          className="w-10 h-10 rounded-full"
          onError={(e) => (e.target.src = "/m.svg")}
        />

        <div>
          <p className="text-sm font-semibold">{req.name}</p>
          <p className="text-xs text-gray-400">
            Wants to connect
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex gap-2">
        <button
          onClick={() => onDecline(req._id)}
          className="text-xs px-3 py-1 rounded-full bg-gray-200"
        >
          Decline
        </button>

        <button
          onClick={() => onAccept(req._id)}
          className="text-xs px-3 py-1 rounded-full bg-blue-500 text-white"
        >
          Accept
        </button>
      </div>
    </div>
  );
}