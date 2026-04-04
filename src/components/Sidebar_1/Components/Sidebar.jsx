import { useContext, useEffect, useState } from "react";
import { Theme } from "../../../theme/globalTheme";
import { data, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/Profile";
import Modal from "react-modal";
import { motion, AnimatePresence } from "framer-motion";
import GroupChat from "../../Group";
import { QRCode } from "react-qrcode-logo";
import Logo from "/public/m.svg";
import { useAuth } from "../../../context/AuthContex";
const SkeletonCard = ({ i }) => (
  <motion.div
    key={i}
    initial={{ opacity: 0.4 }}
    animate={{ opacity: 1 }}
    transition={{
      repeat: Infinity,
      duration: 1,
      ease: "easeInOut",
      repeatType: "reverse",
    }}
    className="mb-3 flex justify-start"
  >
    <div className="max-w-[80%] w-full bg-[#1e293b] rounded-2xl p-3 relative overflow-hidden">
      {/* shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />

      {/* fake content */}
      <div className="h-4 bg-gray-500 rounded w-1/3 mb-2"></div>
      <div className="h-3 bg-gray-600 rounded w-full mb-1"></div>
      <div className="h-3 bg-gray-600 rounded w-5/6 mb-1"></div>
      <div className="h-3 bg-gray-600 rounded w-2/3"></div>
    </div>
  </motion.div>
);

export function Sidebar_One({ token }) {
  const { user,setUser } = useAuth();
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);
  const { setIsProfile } = useContext(UserContext);
  const [alertVisible, setAlertVisible] = useState(false);
  const [copied, setCopied] = useState("");
  const [requests, setRequests] = useState([]);
  // const [forSender, setForSender] = useState([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [showGroupSection, setShowGroupSection] = useState(false);
  const [BroadCastModal, SetBroadCastModal] = useState(false);
  const [trackBraodCastData, setTrackBraodCastData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [invite, setInvite] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState(false);
  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  function openBoardCastModal() {
    SetBroadCastModal(true);
  }
  function closeBoardCastModal() {
    SetBroadCastModal(false);
  }

  function handleClick(str) {
    setActive(str);
  }

  function openInviteModal() {
    setInvite(true);
  }
  function closeInviteModal() {
    setInvite(false);
  }

 

  const tractBraodcastMessage = async () => {
    try {
      setIsLoading(true);
      fetch(`${import.meta.env.VITE_BACK_DEV_API}/broadcasts`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          // console.log(data?.broadcasts);
          setTrackBraodCastData(data.broadcasts || []);
        });
    } catch (error) {
      console.log("Failed to fetch /broadcasts");
      setTrackBraodCastData([]);
    } finally {
      setIsLoading(false);
    }
  };

const handleAccept = async (senderId) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${senderId}/accept`,
      {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error();

    const acceptedUser = requests.find((r) => r._id === senderId);

    //  1. close popup
    // setOpen(false);

    //  2. instant UI update (OLD BEHAVIOR - KEEP THIS)
    if (acceptedUser) {
      window.dispatchEvent(
        new CustomEvent("friend-added", {
          detail: acceptedUser,
        })
      );
    }

    //  3. fetch fresh user (SOURCE OF TRUTH)
    const userRes = await fetch(
      `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
      { credentials: "include" }
    );

    const updated = await userRes.json();
    setUser(updated.user);

    //  4. 🔥 get FULL friend with chatId
    const fullFriend = updated.user.friends?.find(
      (f) => f._id === senderId
    );

    //  5. 🔥 FIX Messaging issue
    if (fullFriend) {
      setSelectedFriend({ ...fullFriend }); // IMPORTANT
    }

  } catch (err) {
    console.error("Accept failed", err);
  }
};

const handleDecline = async (senderId) => {
  try {
    // setOpen(false); 

    await fetch(
      `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${senderId}/decline`,
      {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const res = await fetch(
      `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
      { credentials: "include" }
    );

    const updated = await res.json();
    setUser(updated.user);

  } catch (err) {
    console.error("Decline failed");
  }
};
const handleAcceptAll = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/acceptall`,
      {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error();

    // ✅ 1. 🔥 INSTANT UI (LIKE SINGLE ACCEPT)
    requests.forEach((req) => {
      window.dispatchEvent(
        new CustomEvent("friend-added", {
          detail: req,
        })
      );
    });

    // ✅ 2. clear request UI
    setRequests([]);

    // ✅ 3. refresh real data
    const userRes = await fetch(
      `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
      { credentials: "include" }
    );

    const updated = await userRes.json();
    setUser(updated.user);

  } catch (err) {
    console.error("Accept all failed");
  }
};


  const copyToClipboard = (link) => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(link);
        setAlertVisible(true);
        setTimeout(() => {
          setAlertVisible(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const groupedBroadcasts = trackBraodCastData.reduce((acc, item) => {
    const date = new Date(item.createdAt);

    // format like: "Today", "Yesterday", or full date
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label;

    if (date.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString();
    }

    if (!acc[label]) acc[label] = [];
    acc[label].push(item);

    return acc;
  }, {});

  const sendInviteByCode = async () => {
  if (!inviteInput.trim()) return;

  try {
    setInviteLoading(true);

    const res = await fetch(
      `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${inviteInput}`,
      {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error();

    setInviteInput("");

    // ✅ SUCCESS ANIMATION
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 2000);

  } catch (err) {
    setInviteError(true);
    setTimeout(() => setInviteError(false), 2000);
  } finally {
    setInviteLoading(false);
  }
};
useEffect(() => {
  if (user?.friendRequestsReceived) {
    setRequests(user.friendRequestsReceived);
  } else {
    setRequests([]);
  }
}, [user]);

useEffect(() => {
  if (!open) return;

  fetch(`${import.meta.env.VITE_BACK_DEV_API}/api/me`, {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      setUser(data.user); // 🔥 THIS IS KEY
    })
    .catch(() => {});
}, [open]);

// const requests = user?.friendRequestsReceived || [];

  return (
    <>
      <div
        className="w-[15%] sm:w-[10%] md:w-[5%]"
        style={{ backgroundColor: Theme.thirdBackgroundColor }}
      >
        <div className="flex items-center justify-between h-screen flex-col py-5">
          <div className="flex flex-col gap-5  lg:text-xl text-sm ">
            <i className="fa-solid fa-bars cursor-pointer"></i>
            <i
              className="fa-solid fa-message cursor-pointer"
              title="Chats"
              onClick={() => setIsProfile(false)}
              style={{
                color:
                  active === "msg"
                    ? Theme.button.active
                    : Theme.button.inactive,
              }}
            ></i>
            {/* <i className="fa-solid fa-code  cursor-pointer " title="Code"></i> */}
            <i
              className="fa-solid fa-video cursor-pointer"
              title="Video calls"
              onClick={() => handleClick("vid")}
              style={{
                color:
                  active === "vid"
                    ? Theme.button.active
                    : Theme.button.inactive,
              }}
            ></i>
            <i
              className="fa-solid fa-users-line cursor-pointer"
              title="Plugins"
              onClick={() => {
                handleClick("group");
                setShowGroupSection(true);
              }}
              style={{
                color:
                  active === "group"
                    ? Theme.button.active
                    : Theme.button.inactive,
              }}
            ></i>
          </div>
          <div className="flex flex-col gap-3 lg:text-xl text-sm">
            {/* <i className="fa-solid fa-hand-point-up"></i> */}
            <i className="fa-solid fa-user-plus cursor-pointer" onClick={openInviteModal}></i>
            <i
              className="fa-solid fa-bullhorn cursor-pointer"
              title="BroadCast"
              onClick={() => {
                openBoardCastModal();
                tractBraodcastMessage();
              }}
            ></i>
            <div>
              <div
                onClick={() => setOpen(!open)}
                className="flex   justify-center items-end"
              >
                <div className="">
                  {open ? (
                    <i className="fa-regular fa-envelope-open cursor-pointer"></i>
                  ) : (
                    <i className="fa-regular fa-envelope cursor-pointer"></i>
                  )}
                </div>
                <span className="bg-black p-[4px] rounded-full   absolute "></span>
              </div>
              <AnimatePresence>
                {open && (
                  <motion.div
                  key={JSON.stringify(requests)}
                    initial={{ opacity: 0, x: -40, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.8 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 20,
                      mass: 0.6,
                    }}
                    className="popup absolute bottom-1/12 rounded-lg left-12 md:left-15 bg-blue-300 z-20 p-2 w-70"
                  >
                    <div className="flex  items-center gap-1 justify-between ">
                      <h3>Friend Requests</h3>
                      {/* {forSender?.friendRequestsReceived?.length > 0 ? (
                        <div className="bg-black w-4 h-4 rounded-full text-white text-[0.6rem]  text-center flex items-center justify-center font-semibold">
                          {requests.length}
                        </div>
                      ) : (
                        ""
                      )} */}
                      <button onClick={handleAcceptAll} className="text-xs bg-blue-500 px-2 rounded-xl font-semibold text-white">accept all</button>
                    </div>
                    {requests.length === 0 ? (
                      <p className="text-xs">No new requests.</p>
                    ) : (
                      <AnimatePresence>
                        <div className="h-50 overflow-y-scroll p-2" style={{scrollbarWidth: "none"}}>
                          {requests.map((req) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6, x: 50 }}
                            transition={{ duration: 0.2 }}
                            key={req._id}
                            className="request-item flex items-center justify-between mb-2 px-2 py-1 rounded-xl"
                            style={{backgroundColor: Theme.thirdBackgroundColor}}
                          >
                            <div className="flex items-end gap-2">
                              <img
                                className="w-7 h-7 rounded-full"
                                src={req.picture}
                                alt={req.name}
                              />
                              <p className="text-xs font-semibold uppercase">
                                {req.name}
                              </p>
                            </div>
                            <div className="flex flex-col justify-between gap-2 p-1">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleDecline(req._id)}
                                  className="bg-red-100 p-0.5 rounded-md text-xs"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => handleAccept(req._id)}
                                  className="bg-amber-300 p-1 rounded-md text-xs"
                                >
                                  Accept
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        </div>
                      </AnimatePresence>
                    )}
                    <div className="flex flex-col justify-center items-center mt-2">
                      <div className="flex items-center gap-2 bg-gray-200  rounded-sm">
                        <button
                          className="text-xs font-medium px-1"
                          onClick={() =>
                            copyToClipboard(
                              `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${user.inviteNumber}`,
                            )
                          }
                        >
                          Invite Friend
                        </button>
                        <i
                          onClick={() =>
                            copyToClipboard(
                              `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${user.inviteNumber}`,
                            )
                          }
                          className="fa-solid fa-copy text-white bg-gray-500 p-1  text-xs font-medium rounded-tr-sm rounded-br-sm"
                        ></i>
                        {alertVisible && (
                          <div className="fixed mt-2 top-0 right-0 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-4 shadow-md flex items-start gap-3 max-w-sm transition-transform">
                            <span className="text-blue-500 text-xl">✓</span>
                            <div className="flex-1">
                              <p className="font-semibold">
                                Copied to clipboard!
                              </p>
                              <p className="text-sm break-all">{copied}</p>
                            </div>
                            <button
                              className="text-slate-500 hover:text-slate-700 text-lg"
                              onClick={() => setAlertVisible(false)}
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-xs underline ">
                        copy url then Share{" "}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <i
              className="fa-solid fa-user"
              onClick={() => setIsProfile(true)}
            ></i>

            <i className="fa-solid fa-gear"></i>
          </div>
        </div>

        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={customStyles}
        >
          <p>this is the content </p>
        </Modal>
      </div>
      <AnimatePresence>
        {BroadCastModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-200 p-5 rounded-xl max-h-1/2 overflow-y-scroll"
              initial={{ scale: 1 }}
              animate={{ scale: 0.9 }}
              exit={{ scale: 1 }}
              style={{
                scrollbarWidth: "none",
                backgroundColor: Theme.thirdBackgroundColor,
              }}
            >
              <div className="flex justify-end py-2 sticky top-0 z-20">
                <p
                  onClick={closeBoardCastModal}
                  className=" bg-gray-400 px-3 py-1 rounded-md font-bold cursor-pointer"
                >
                  ESC
                </p>
              </div>

              {Object.entries(groupedBroadcasts).map(([date, items]) => (
                <div key={date} className="mb-6">
                  {/*  DATE HEADER */}
                  <div className="flex justify-center mb-4 sticky top-0 z-20">
                    <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full shadow">
                      {date}
                    </span>
                  </div>

                  {/*  BROADCASTS */}
                  {isLoading ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <SkeletonCard key={i} i={i} />
                      ))}
                    </>
                  ) : items.length === 0 ? (
                    <div className="text-center text-gray-400">
                      No broadcasts yet
                    </div>
                  ) : (
                    items.map((d, i) => (
                      <motion.div
                        key={d?._id || i}
                        layout
                        initial={{ opacity: 0, scale: 0.8, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.7, x: 20 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="mb-3 flex justify-start"
                      >
                        <div className="max-w-[80%] bg-[#1e293b] rounded-2xl shadow-xl border border-white/10 p-3 relative backdrop-blur-md">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-2 gap-4">
                            <span className="text-[14px] bg-blue-500/90 text-white px-2 py-[2px] rounded-full font-semibold flex items-center gap-1">
                              <i className="fa-solid fa-bullhorn text-[10px]"></i>
                              BROADCAST
                            </span>

                            <span className="text-[14px] text-gray-400 font-semibold">
                              {new Date(d.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Message */}
                          <div
                            className="text-md text-gray-200 leading-relaxed break-words [&_*]:text-gray-200"
                            dangerouslySetInnerHTML={{ __html: d?.text }}
                          />

                          {/* Footer */}
                          <div className="flex items-center justify-end gap-4 mt-3 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1 text-sm">
                              <i className="fa-regular fa-eye text-white"></i>{" "}
                              {d.seenCount}
                            </span>

                            <span className="flex items-center gap-1">
                              <i className="fa-solid fa-users"></i>{" "}
                              {d.totalRecipients}
                            </span>
                          </div>

                          <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent"></div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
        {invite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[999]"
          >
            <motion.div
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 40 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              className="relative w-[90%] max-w-sm bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-5 flex flex-col items-center gap-4 border border-white/20"
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={closeInviteModal}
                className="absolute top-3 right-3 text-gray-500 hover:text-black text-lg"
              >
                Esc
              </button>

              {/* TITLE */}
              <h2 className="text-lg font-semibold text-gray-800">
                Invite Friends
              </h2>

              {/* QR BOX */}
              <div className="bg-white p-3 rounded-xl shadow-inner border border-gray-200">
                <QRCode
                  value={`${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${user?.inviteNumber}`}
                  logoImage={Logo}
                  logoWidth={35}
                  logoHeight={25}
                  logoPadding={2}
                  logoPaddingStyle="circle"
                  removeQrCodeBehindLogo={true}
                  ecLevel="H"
                />
              </div>

              {/* INVITE LINK */}
              <p className="text-[11px] text-gray-500 text-center break-all">
                {`${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${user.inviteNumber}`}
                {/* {user.inviteNumber} */}
              </p>

              <div className="flex gap-3 items-center px-2 text-[#333] font-semibold rounded-md" style={{background: Theme.thirdBackgroundColor}}>
                <span>{user.inviteNumber}</span>
                <i className="fa-regular fa-copy cursor-pointer" onClick={() => copyToClipboard(user.inviteNumber)}></i>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${user.inviteNumber}`,
                    )
                  }
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-xs py-2 rounded-md"
                >
                  Copy Link
                </button>

                <button
                  onClick={() =>
                    navigator.share?.({
                      title: "Add me",
                      text: "Join me on chat",
                      url: `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${user?.inviteNumber}`,
                    })
                  }
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 rounded-md"
                >
                  Share
                </button>
              </div>
              <div className="w-full flex flex-col gap-2 mt-2">
                <p className="text-xs text-gray-500 text-center">
                  Or enter invite code
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 10-digit code"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />

                  <button
                    onClick={sendInviteByCode}
                    disabled={inviteLoading}
                    className="bg-blue-500 hover:bg-blue-200 hover:font-semibold hover:text-black cursor-pointer text-white px-3 py-2 rounded-md text-sm"
                  >
                    {inviteLoading ? "..." : "Add"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {inviteSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="fixed top-5 right-5 bg-green-500 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-[9999]"
        >
          <span className="text-lg">✅</span>
          <span className="text-sm font-medium">Request Sent</span>
        </motion.div>
      )}
      {inviteError && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="fixed top-5 right-5 bg-red-500 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-[9999]"
        >
          <span className="text-lg">❌</span>
          <span className="text-sm font-medium">Invalid Code</span>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};
