import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContex";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qrcode-logo";
import html2canvas from "html2canvas";


function generateInviteLink(user) {
  const payload = {
    code: user.inviteNumber,
    exp: Date.now() + 60 * 60 * 1000,
    // exp: Date.now() + 6 * 1000, // for test 6 sec
    secret: "monkey123",
  };

  const encoded = btoa(JSON.stringify(payload));

  return `https://merchantcoin.shop/friend-invitation?invitecode=${encoded}`;
}


const UserProfile = () => {
  const { user, setUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [enableTour, SetEnableTour] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const qrRef = useRef(null)


  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        password: "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      const onlyNums = value.replace(/\D/g, "");
      if (onlyNums.length > 10) {
        setError("Phone must be 10 digits");
        return;
      }
      setError("");
      setForm((prev) => ({ ...prev, phoneNumber: onlyNums }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (form.phoneNumber && form.phoneNumber.length !== 10) {
      setError("Phone must be 10 digits");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/api/user`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password || undefined,
            phoneNumber: form.phoneNumber || null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Update failed");
        return;
      }

      setUser((prev) => ({
        ...prev,
        ...data.user,
      }));

      setIsEditing(false);
    } catch {
      setError("Update failed");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACK_DEV_API}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch { }

    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    window.location.href = "/";
  };

  if (!user) {
    return <div className="p-4">No user data</div>;
  }

  const handleShareQR = async () => {
    try {
      const canvas = await html2canvas(qrRef.current);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      const file = new File([blob], "invite-qr.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${user.name} is on Meetup 👋`,

          text: `
Hey! 😊 ${user.name} there.

I'm on *Meetup* — come join me and let's connect as friends 💬

🔗 Tap to connect with me:
${generateInviteLink(user)}

📷 Or scan the QR code to join instantly

⏳ This invite expires in 1 hour

See you on Meetup! 🚀
`,
          files: [file], // ✅ QR IMAGE
        });
      } else {
        alert("Sharing not supported on this device");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
  if (user.isStar && !localStorage.getItem("starUnlocked")) {
    setJustUnlocked(true);
    localStorage.setItem("starUnlocked", "true");
  }
}, [user.isStar]);
  return (
    <div className="w-full h-[80vh] overflow-hidden overflow-y-scroll bg-gradient-to-b from-white to-gray-100 p-4 sm:p-6 flex flex-col gap-6 rounded-2xl">

      {/* 🔹 HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b pb-4">

        <div className="flex items-center gap-4">
          {user.isStar === true ? (
            <>
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
            </>
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow">
              <img src={user.picture} className="rounded-full" onError={(e) => e.target.src = '/m.svg'} alt="" />
            </div>
          )}

          <div className="break-all">
            <h2 className="text-base sm:text-lg font-semibold">{user.name}</h2>
            <p className="text-xs sm:text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 flex-wrap justify-start sm:justify-end">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-md text-white text-sm"
            >
              Edit <i className="fa-solid fa-pen"></i>
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-md text-white text-sm"
              >
                Save <i className="fa-solid fa-check"></i>
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md text-white text-sm"
              >
                Cancel <i className="fa-solid fa-xmark"></i>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mt-4">

        {/* TITLE */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            ⭐ Star Status
          </span>

          {user.isStar ? (
            <span className="text-green-500 text-xs font-medium">
              Active
            </span>
          ) : (
            <span className="text-gray-400 text-xs">
              Not yet
            </span>
          )}
        </div>
{justUnlocked && (
  <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">

    <div className="bg-white rounded-2xl p-6 text-center max-w-xs w-full">

      {/* BIG STAR */}
      <div className="text-5xl mb-3 animate-bounce">⭐</div>

      {/* HEADLINE */}
      <h2 className="text-lg font-bold">
        You’re now a Star!
      </h2>

      {/* SUBTEXT */}
      <p className="text-sm text-gray-500 mt-2">
        You officially unlocked Meetup Star status 🚀
      </p>

      {/* CTA */}
      <button
        onClick={() => setJustUnlocked(false)}
        className="mt-4 bg-blue-400 font-semibold cursor-pointer text-white px-4 py-2 rounded-full text-sm"
      >
        Awesome 🔥
      </button>

    </div>
  </div>
)}
        {/* PROGRESS */}
        {!user.isStar && (
          <>
            <div className="text-xs text-gray-500 mb-2">
              Create {user.starProgress.required} broadcasts & channels
            </div>

            {/* CHANNEL */}
            <div className="mb-2">
              <div className="text-[11px] text-gray-400 mb-1">
                Channels ({user.starProgress.channel}/5)
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${(user.starProgress.channel / 5) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* BROADCAST */}
            <div>
              <div className="text-[11px] text-gray-400 mb-1">
                Broadcasts ({user.starProgress.broadcast}/5)
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: `${(user.starProgress.broadcast / 5) * 100}%`,
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* ⭐ FINAL STATE */}
        {user.isStar && (
  <div className="mt-3 text-center">

    {/* 🔥 BIG BADGE */}
    <div className="text-3xl mb-2 animate-pulse">
      ⭐
    </div>

    {/* 🎯 MAIN TEXT */}
    <div className="text-base font-bold text-yellow-500">
      Official Meetup Star
    </div>

    {/* 💬 SUBTEXT */}
    <div className="text-xs text-gray-500 mt-1">
      You unlocked creator status 🚀
    </div>

    {/* 🏆 BADGE */}
    <div className="mt-3 inline-flex items-center gap-1 bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs font-medium">
      <i className="fa-solid fa-crown"></i>
      Star Creator
    </div>

  </div>
)}

      </div>
      {/* ERROR */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-500 text-sm bg-red-50 p-2 rounded-md"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔹 MAIN CONTENT */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT - FORM */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col gap-4"
        >

          {/* NAME */}
          {isEditing ? (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
              placeholder="Name"
            />
          ) : (
            <div className="bg-white p-3 rounded-lg shadow text-sm sm:text-base">
              Name: {user.name}
            </div>
          )}

          {/* EMAIL */}
          {isEditing ? (
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
              placeholder="Email"
            />
          ) : (
            <div className="bg-white p-3 rounded-lg shadow text-sm sm:text-base">
              Email: {user.email}
            </div>
          )}

          {/* PHONE */}
          {isEditing ? (
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
              placeholder="Phone (10 digit)"
            />
          ) : (
            <div className="bg-white p-3 rounded-lg shadow text-sm sm:text-base">
              Phone: {user.phoneNumber || "Not added"}
            </div>
          )}

          {/* STATUS */}
          {!isEditing && (
            <div className="bg-white p-3 rounded-lg shadow text-sm sm:text-base">
              Status:{" "}
              {user.isVerify ? (
                <span className="text-green-600 font-semibold">Verified</span>
              ) : (
                <span className="text-yellow-600 font-semibold">Not verified</span>
              )}
            </div>
          )}

          {/* PASSWORD */}
          {isEditing && (
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
              placeholder="New Password (optional)"
            />
          )}
        </motion.div>

        {/* RIGHT - QR */}
        <div className="flex flex-col items-center gap-4 w-full lg:w-[300px]">

          <div
            ref={qrRef}
            style={{
              backgroundColor: "#ffffff",
              color: "#000000",
            }}
          // className="bg-white p-4 rounded-xl shadow-md border flex justify-center"
          >
            <a
              href={generateInviteLink(user)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <QRCode
                value={generateInviteLink(user)}
                logoImage={'/m.svg'}
                logoWidth={35}
                logoHeight={25}
                logoPadding={2}
                logoPaddingStyle="circle"
                removeQrCodeBehindLogo={true}
                ecLevel="L"
                size={180}
              />
            </a>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() =>
                navigator.clipboard.writeText(generateInviteLink(user))
              }
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-xs py-2 rounded-md"
            >
              Copy Link
            </button>

            <button
              onClick={handleShareQR}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 rounded-md"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 FOOTER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">

        <button
          onClick={() => {
            localStorage.setItem("tourActive", "true");
            window.location.reload();
          }}
          className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg"
        >
          Enable Tour again
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
/**
 * make it responsice to both mobile n desk dont change any vaiable just fix the ui
 */