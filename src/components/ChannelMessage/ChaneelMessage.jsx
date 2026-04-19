import { AnimatePresence, motion } from "framer-motion";
import { Theme } from "../../theme/globalTheme";
import { useEffect, useState } from "react";

import { useSocket } from "../../context/SocketContext";
import { useRef } from "react";
import { useAuth } from "../../context/AuthContex";
import { useNavigate } from "react-router-dom";
export function ChannelMessage({ channelid, fullchannelobject, onBack }) {
  const { user } = useAuth();
  const channel = fullchannelobject;
  const BroadCastChannel = channel.isBroadcast

  const { socket, isReady, channelMessages, channelPinned, setActiveChannel, channelUnread, setChannelUnread, channelOnline, setChannelMessages, setChannelPinned } = useSocket();


  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [message, setMessage] = useState("");
  const [command, setCommand] = useState(false);

  const [getPreviewData, setGetPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // const [messages, setMessages] = useState([]);

  const messages = channelMessages[channelid] || [];

  const [hoveredMessageIndex, setHoveredMessageIndex] = useState(null);
  const [reactionMenuOpenIndex, setReactionMenuOpenIndex] = useState(null);

  // const [pinnedMessages, setPinnedMessages] = useState([]);
  const pinnedIds = channelPinned[channelid] || [];
  const pinnedMessages = pinnedIds
    .map((id) =>
      messages.find((m) => String(m._id) === String(id))
    )
    .filter(Boolean);
  const [activePinIndex, setActivePinIndex] = useState(0);
  const [highlightedMsg, setHighlightedMsg] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const notificationAudio = useRef(null);
  const isSelectingRef = useRef()
  const containerRef = useRef();
  const navigate = useNavigate();
  const seenMessagesRef = useRef(new Set());
  const isAdmin = String(user._id) === String(channel.creator);
  const textareaRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    setActiveChannel(channelid);

    // 🔥 reset unread when opening
    setChannelUnread((prev) => ({
      ...prev,
      [channelid]: 0,
    }));

    return () => {
      setActiveChannel(null);
    };
  }, [channelid]);
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowMenu(false);
        setShowInfo(false);
        setShowPinned(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);


  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";

    const maxHeight = 120;

    if (el.scrollHeight > maxHeight) {
      el.style.height = maxHeight + "px";
      el.style.overflowY = "auto";
    } else {
      el.style.height = el.scrollHeight + "px";
      el.style.overflowY = "hidden";
    }
  }, [message]);





  useEffect(() => {
    setChannelUnread((prev) => ({
      ...prev,
      [channelid]: 0,
    }));
  }, [channelid]);


  useEffect(() => {
    socket.emit("join_channel", { channelId: channelid });

    // return () => {
    //   socket.emit("leave_channel", { channelId: channelid });
    // };
  }, [channelid]);




  useEffect(() => {
    if (!socket) return;

    const handlePreview = (data) => {
      console.log("PREVIEW:", JSON.stringify(data));
      setGetPreviewData(data);
      setIsPreviewLoading(false);
      setIsPreviewLoading(false);
    };

    const handleError = (err) => {
      console.log("PREVIEW ERROR:", err);
      setShowPreview(false);
    };

    socket.on("link_preview_result", handlePreview);
    socket.on("link_preview_error", handleError);

    return () => {
      socket.off("link_preview_result", handlePreview);
      socket.off("link_preview_error", handleError);
    };
  }, [socket]);


  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight);

    if (distanceFromBottom < 150) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!socket || !messages.length) return;

    messages.forEach((msg) => {
      // ✅ already seen → skip
      if (seenMessagesRef.current.has(msg._id)) return;

      socket.emit("channel_seen", {
        channelId: channelid,
        messageId: msg._id,
      });

      // ✅ mark as seen locally
      seenMessagesRef.current.add(msg._id);
    });
  }, [messages]);







  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    const match = value.match(/(https?:\/\/[^\s]+)/);

    if (match && socket) {
      console.log("📤 Sending URL for preview:", match[0]);

      setShowPreview(true);
      setIsPreviewLoading(true);
      setGetPreviewData(null);

      socket.emit("get_link_preview", match[0]);
    }

    // reset if no link
    if (!match) {
      setShowPreview(false);
      setGetPreviewData(null);
      setIsPreviewLoading(false);
    }
  };


  const handleSendMessage = () => {
    if (!message.trim() || !socket) return;

    socket.emit("send_channel_message", {
      channelId: channelid,
      text: message,
      preview: getPreviewData,
    });

    // reset input
    setMessage("");
    setGetPreviewData(null);
    setShowPreview(false);
  };




  useEffect(() => {
    const loadChannel = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACK_DEV_API}/channels/${channelid}`,
          {
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok) return;

        //  LOAD MESSAGES
        setChannelMessages((prev) => ({
          ...prev,
          [channelid]: data.messages || [],
        }));

        // ✅ LOAD PINNED
        setChannelPinned((prev) => ({
          ...prev,
          [channelid]: data.pinnedMessages || [],
        }));

      } catch (err) {
        console.log("Hydration failed");
      }
    };

    if (channelid) {
      loadChannel();
    }
  }, [channelid]);


  useEffect(() => {
    const unlockAudio = () => {
      notificationAudio.current?.play().then(() => {
        notificationAudio.current.pause();
        notificationAudio.current.currentTime = 0;
      }).catch(() => { });

      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
  }, []);

  const handleReaction = (msgIndex, emoji) => {
    const msg = messages[msgIndex];

    if (!socket) return;

    socket.emit("channel_react", {
      channelId: channelid,
      messageId: msg._id,
      emoji,
    });
  };

  const handleLeaveChannel = async () => {
    try {
      setIsDeleting(true); // 🔥 start loader

      await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/channels/${channelid}/leave`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      // 🔥 CLEAR LOCAL STATE (VERY IMPORTANT)
      setChannelMessages((prev) => {
        const updated = { ...prev };
        delete updated[channelid];
        return updated;
      });

      setChannelPinned((prev) => {
        const updated = { ...prev };
        delete updated[channelid];
        return updated;
      });

    } catch (err) {
      console.log("Leave failed");
      setIsDeleting(false);
    } finally {
      setTimeout(() => {
        window.location.href = "/chats";
      }, 300);

    }
  };

  return (
    <>
      <AnimatePresence>
        <div
          className="w-[100%] h-screen flex flex-col overflow-hidden"
          style={{ backgroundColor: Theme.primaryBackgroundColor }}
        >
          {/*  HEADER (same as chat) */}
          <header className="sticky top-0 bg-white shadow-sm px-3 pt-3 flex items-center gap-3 ">

            <i
              onClick={() => {
                onBack();
                navigate("/chats", { replace: true });
              }}
              className="fa-solid fa-arrow-left text-xl cursor-pointer"
            ></i>
            <div className="flex justify-between w-full pb-1 items-center">
              <div className="flex gap-2">
                {/* CHANNEL ICON */}
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <i className="fa-solid fa-bullhorn"></i>
                </div>

                {/* CHANNEL INFO */}
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {channel?.name}
                    </span>
                    {BroadCastChannel === true ? "" : (
                      channelOnline && (
                        <p className="max-sm:hidden text-sm text-green-800 font-semibold px-2 rounded-md bg-green-300" >
                          {channelOnline[channelid] || 0} online
                        </p>
                      )
                    )}
                  </div>

                  {BroadCastChannel === true ? (
                    channel?.totalSubscribers + "  Recipients"
                  ) : (
                    <span className="text-sm text-gray-500">
                      {channel?.totalSubscribers} subscribers
                    </span>
                  )}
                </div>
              </div>


              {/* {isAdmin && (
                <a href={`${import.meta.env.VITE_VIDEO_CALL_API}`} target="_blank" className="bg-blue-400 px-3 py-2 rounded-xl" >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-video text-white"></i>
                    <span className="font-semibold text-sm">Start Video</span>
                  </div>
                </a>
              )} */}
              {BroadCastChannel === true ? "" : (
                <div
                  onClick={() => {
                    const link = `${import.meta.env.VITE_BACK_DEV_API}/join/${channel.inviteCode}`;
                    navigator.clipboard.writeText(link);
                    alert("Invite link copied!");
                  }}
                  className="hidden md:flex gap-10 items-center cursor-pointer hover:bg-blue-100 py-1 px-2 rounded-md"
                >
                  {/* <i className="fa-solid fa-link"></i> */}
                  <span>Share Invite Link</span>
                </div>
              )}
              <div
                onClick={() => {
                  const link = `${import.meta.env.VITE_BACK_DEV_API}/join/${channel.inviteCode}`;

                  const message = `Join my channel 🚀\n${link}`;

                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

                  window.open(whatsappUrl, "_blank");
                }}
              >
                <i class="sm:hidden fa-solid fa-share-nodes"></i>
              </div>
              <div className="flex items-center gap-4">
                <i className="fa-solid fa-magnifying-glass text-lg text-blue-400 hover:text-black cursor-pointer h-10 pt-3 "></i>
                <i onClick={() => setShowInfo(true)} className="fa-solid fa-table-columns text-lg text-blue-400 hover:text-black cursor-pointer h-10 pt-3"></i>
                <i onClick={() => setShowMenu(true)} className="fa-solid fa-ellipsis text-lg text-blue-400 hover:text-black cursor-pointer h-10 pt-3"></i>
              </div>
            </div>
          </header>


          {pinnedMessages.length > 0 && (
            <motion.div className="absolute top-14 w-[62%] z-20 "
              key="pinned-bar"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              {/* {pinnedMessage ? (  */}
              <div
                onClick={() => {
                  if (pinnedMessages.length === 0) return;

                  const next =
                    pinnedMessages.length > 1
                      ? (activePinIndex + 1) % pinnedMessages.length
                      : 0;

                  setActivePinIndex(next);

                  const msgIndex = messages.findIndex(
                    (m) => String(m._id) === String(pinnedMessages[next]?._id)
                  );

                  if (msgIndex !== -1) {
                    setHighlightedIndex(msgIndex);

                    // 🔥 SCROLL TO MESSAGE
                    setTimeout(() => {
                      const el = document.getElementById(`msg-${msgIndex}`);
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }, 100);

                    setTimeout(() => {
                      setHighlightedIndex(null);
                    }, 1200);
                  }
                }}
                className="w-full px-3 py-1 flex items-center gap-2 cursor-pointer "
                style={{ background: Theme.thirdBackgroundColor }}
              >

                {/* LEFT STRIP */}
                <motion.div className="flex flex-col gap-0.8">

                  {/* TOP BAR */}
                  <motion.div
                    className="w-0.5 h-5 rounded-full"
                    animate={{
                      backgroundColor: activePinIndex === 0 ? "#00d9ff" : "#8e8e8e"
                    }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* BOTTOM BAR */}
                  <motion.div
                    className="w-0.5 h-5 rounded-full"
                    animate={{
                      backgroundColor: activePinIndex === 1 ? "#00d9ff" : "#8e8e8e"
                    }}
                    transition={{ duration: 0.3 }}
                  />

                </motion.div>

                {/* CONTENT */}
                <motion.div className="flex flex-col flex-1"
                  key={activePinIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >

                  <span className="text-sm font-semibold">
                    {/* {activePinIndex ? "Previous" : "Pinned Message"} */}
                    {activePinIndex ? "Pinned Message" : "Previous"}
                    {/* {pinnedMessages.length > 1 && (
                        <span className="text-xs ml-2 text-gray-500">
                          ({activePinIndex + 1}/{pinnedMessages.length})
                        </span>
                      )} */}
                  </span>

                  <span className="text-sm line-clamp-1 ">
                    {pinnedMessages[activePinIndex]?.text}
                  </span>

                  {pinnedMessages[activePinIndex]?.preview?.url && (
                    <span className="text-xs text-blue-700 truncate">
                      {/* {pinnedMessages[activePinIndex].preview.url} */}
                    </span>
                  )}
                </motion.div>

                {/* 📌 ICON → OPEN SLIDER */}
                <div
                  onClick={(e) => {
                    e.stopPropagation(); // 🔥 prevent switching
                    setShowPinned(true);
                  }}
                  className="flex items-center cursor-pointer"
                >
                  <i className="fa-solid fa-thumbtack text-lg text-[#383333]"></i>
                </div>
              </div>
            </motion.div>
          )}

          {/*  BODY (EMPTY STATE FOR NOW) */}
          <main className="flex-1 px-6 overflow-hidden">

            <div
              ref={containerRef}
              id="chat-container"
              className="w-full h-full flex flex-col gap-1 overflow-y-auto scroll-smooth" style={{ scrollbarWidth: 'none' }} >
              <div className={`flex ${BroadCastChannel === true ? "" : ""} flex-col mt-auto  gap-2 pb-5 pt-15`}>
                <div className="absolute top-0 right-[50%] ">
                  {/* <span className="bg-gray-500 font-semibold text-sm px-2 rounded-md text-white">
                    April 6, 2026
                  </span> */}
                </div>

                {/* This is for Preview for the openGrapql n get the information from the Youtube also a link previewer*/}
                {messages.map((msg, index) => (
                  <motion.div
                    id={`msg-${index}`}
                    key={msg.id || index}
                    // initial={false}
                    initial={index === messages.length - 1 ? { opacity: 0, y: 40 } : false}
                    animate={{
                      opacity: 1,
                      y: 0,
                      backgroundColor:
                        highlightedIndex === index ? "#f3f4f6" : "rgba(243, 244, 246, 0)"
                    }}
                    transition={{
                      backgroundColor: { duration: 0.3 },
                      type: "spring",
                      stiffness: 600,
                      damping: 35,
                    }}

                    className="flex items-end -mb-1 gap-3 rounded-2xl"
                  >
                    {/* 💬 MESSAGE */}
                    <div className="relative bg-blue-400 px-3 py-2 rounded-2xl flex flex-col max-w-[75%]">

                      {BroadCastChannel === true ?
                        "" : String(user._id) === String(channel.creator) ? (
                          <div className="absolute top-1 -right-4" title="Pin">
                            <i
                              onClick={() => {
                                socket.emit("pin_channel_message", {
                                  channelId: channelid,
                                  messageId: msg._id,
                                });
                              }}
                              className="fa-solid fa-thumbtack cursor-pointer text-sm text-gray-700 hover:scale-110"
                            ></i>
                          </div>
                        ) : ''
                      }


                      {/* CHANNEL NAME */}
                      {BroadCastChannel === true ? "" : (
                        <span className="font-semibold text-sm text-amber-900">
                          {channel?.name}
                        </span>
                      )}

                      {/* LINK */}
                      {msg.preview?.url && (
                        <span className="text-sm text-blue-900 hover:underline font-semibold rounded px-1 bg-blue-50 w-fit">
                          <a href={msg.preview.url} target="_blank">
                            {msg.preview.url}
                          </a>
                        </span>
                      )}

                      {/* PREVIEW CARD */}
                      {msg.preview && (
                        <a href={msg.preview.url} target="_blank">
                          <div className="w-60 bg-blue-300 border-l-red-400 border-l-4 rounded-l-lg rounded-r-md my-2 flex flex-col">

                            <span className="px-2 font-semibold text-sm text-amber-900">
                              {msg.preview.siteName}
                            </span>

                            <span className="text-sm font-semibold px-2 line-clamp-2">
                              {msg.preview.title}
                            </span>

                            {msg.preview.images?.[0] && (
                              <img
                                src={msg.preview.images[0] || msg.preview.favicons?.[0]}
                                className="w-full object-cover rounded-bl-lg rounded-r-md"
                              />
                            )}
                          </div>
                        </a>
                      )}

                      {/* MESSAGE TEXT */}
                      <span className="break-all">{msg.text}</span>
                      <div className="flex items-center justify-between gap-3">
                        {/*  REACTION PILLS (BOTTOM LEFT) */}
                        <AnimatePresence>
                          {msg.reactions && Object.values(msg.reactions).some(v => v > 0) && (
                            <motion.div
                              key="reactions"
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              transition={{ duration: 0.25 }}

                              className="flex gap-1"
                            >
                              {Object.entries(msg.reactions)
                                .filter(([_, count]) => count > 0)
                                .map(([emoji, count], i) => (
                                  <motion.span
                                    key={emoji}

                                    initial={{ opacity: 0, y: 15, scale: 0.5 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}

                                    transition={{
                                      delay: i * 0.05,
                                      type: "spring",
                                      stiffness: 500,
                                      damping: 20,
                                    }}
                                    whileTap={{ scale: 1.3 }}
                                    className="bg-white px-2 py-[2px] rounded-full text-xs shadow flex items-center gap-1"
                                  >
                                    {/* {emoji}  {count} */}
                                    {emoji}
                                  </motion.span>
                                ))}
                            </motion.div>
                          )}
                        </AnimatePresence>


                        {/* FOOTER */}

                        {BroadCastChannel === true ? (
                          msg.seenCount > 1 ? <i className="fa-solid fa-check-double text-green-200"></i> : <i className="fa-solid fa-check-double"></i>
                        ) : (
                          <div className="flex justify-end text-xs text-gray-200 mt-1 gap-2">
                            <span className="text-xs text-white">
                              <i className="fa-solid fa-eye"></i> {msg.seenCount || 0}
                            </span>
                            {msg.time}
                          </div>
                        )}
                      </div>

                      {/* MESSAGE TAIL */}
                      {/* <div className="absolute -bottom-1 left-3 w-3 h-3 bg-blue-400 rotate-45"></div> */}
                    </div>

                    <div className="flex flex-col items-start gap-3">
                      {/*  REACTION POPUP (TOP FLOATING) */}
                      {reactionMenuOpenIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, y: 30, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-white px-2 gap-1 rounded-full shadow-lg flex  z-10"
                        >
                          {["❤️", "😂", "👍", "😢", "🔥"].map((emoji) => (
                            <span
                              key={emoji}
                              className=" cursor-pointer hover:scale-125 transition"
                              onClick={() => {
                                handleReaction(index, emoji);
                                setReactionMenuOpenIndex(null);
                              }}
                            >
                              {emoji}
                            </span>
                          ))}
                        </motion.div>
                      )}
                      {/*  RIGHT SIDE BUTTON */}

                      {BroadCastChannel === true ? "" : (
                        <div
                          onClick={() =>
                            setReactionMenuOpenIndex(
                              reactionMenuOpenIndex === index ? null : index
                            )
                          }
                          className="bg-white px-1 py-1 rounded-full shadow cursor-pointer  flex items-center gap-1"
                        >
                          <i className="text-sm fa-regular fa-face-grin"></i>
                          <i className="fa-solid fa-chevron-down text-xs"></i>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

              </div>
            </div>
          </main>

          {/*  FOOTER (DISABLED INPUT FOR NOW) */}

          {/* <div className="absolute bottom-20 right-2">
            <div className="bg-[#00d9ff] p-3 w-10 h-10 rounded-full ">
              <i className="fa-solid fa-chevron-down font-semibold"></i>
            </div>
          </div> */}

          {showPreview && (
            <motion.div
              className="absolute bottom-20 px-3 w-72"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >

              {/* 🔥 LOADING SKELETON */}
              {isPreviewLoading && (
                <div className="bg-gray-100 rounded-xl p-2 shadow-md flex flex-col gap-2">
                  <div className="h-32 bg-gray-300 rounded-lg animate-pulse" />
                  <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-300 rounded w-full animate-pulse" />
                  <div className="h-3 bg-gray-300 rounded w-5/6 animate-pulse" />
                </div>
              )}

              {/* ✅ REAL DATA */}
              {!isPreviewLoading && getPreviewData && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden border">

                  <div className="">
                    {getPreviewData.images?.[0] && (
                      <img
                        src={getPreviewData.images[0]}
                        className="w-full  object-contain"
                      />
                    )}
                  </div>

                  <div className="p-2 flex flex-col gap-1">
                    <span className="text-xs text-gray-500 font-semibold">
                      {getPreviewData.siteName}
                    </span>

                    <span className="text-sm font-semibold text-gray-800 line-clamp-2">
                      {getPreviewData.title}
                    </span>

                    <span className="text-xs text-gray-600 line-clamp-2">
                      {getPreviewData.description}
                    </span>

                    <a
                      href={getPreviewData.url}
                      target="_blank"
                      className="text-xs text-blue-500 truncate"
                    >
                      {getPreviewData.url}
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {/* <footer className="p-4 border-t bg-white flex items-center gap-2">
            {String(user._id) === String(channel.creator) ? (
              <>
                <textarea
                  type="text"
                  value={message}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  placeholder="Only admin can send messages"
                  className="flex-1 px-4 py-2 rounded-full bg-gray-100  outline-none"
                />
                <button
                  disabled={!isAdmin}
                  className="bg-gray-300 px-4 py-2 rounded-full "
                >
                  Send
                </button>
              </>
            ) : (
              <div className="text-center  w-[100%]">
                <p>Only Admin Can Message</p>
              </div>
            )}
          </footer> */}
          {!isAdmin ? (
            <footer className="p-3 border-t bg-white flex items-end gap-2 shrink-0">
              <div
                className={`flex items-end justify-center flex-1 rounded-2xl px-3 py-2 gap-2 shadow-sm transition max-h-[120px] 
              ${isAdmin ? "bg-gray-100" : "bg-gray-200 cursor-not-allowed"}
            `}
              >
                Only admin can send messages
              </div>
            </footer>
          ) : (
            <footer className="p-3 border-t bg-white flex items-end gap-2 shrink-0">

              {/* INPUT CONTAINER */}
              <div
                className={`flex items-end flex-1 rounded-2xl px-3 py-2 gap-2 shadow-sm transition max-h-[120px] 
              ${isAdmin ? "bg-gray-100" : "bg-gray-200 cursor-not-allowed"}
            `}
              >

                {/* TEXTAREA */}
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  rows={1}
                  placeholder={
                    isAdmin
                      ? "Type a message..."
                      : "Only admin can send messages"
                  }
                  className="flex-1 bg-transparent resize-none outline-none text-sm leading-5 max-h-[120px] overflow-y-auto self-end"
                  style={{ minHeight: "30px", scrollbarWidth: 'none' }}
                  onKeyDown={(e) => {
                    if (!isAdmin) return;

                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />

                {/* EMOJI ICON */}
                <i
                  className={`fa-regular fa-face-smile text-gray-500 ${!isAdmin && "opacity-50"
                    }`}
                ></i>

              </div>

              {/* SEND BUTTON */}
              <button
                onClick={handleSendMessage}
                disabled={!isAdmin || !message.trim()}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition
      ${isAdmin && message.trim()
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }
    `}
              >
                <i className="fa-solid fa-paper-plane text-sm"></i>
              </button>

            </footer>
          )}
        </div>

        {/* <AnimatePresence> */}
        {showMenu && (
          <>
            {/* BACKDROP */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-[200]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
            />

            {/* MODAL */}
            <motion.div
              className="fixed top-14 right-1 bg-white rounded-md shadow-xl z-[201] w-56 overflow-hidden"
              initial={{ opacity: 0, scale: 1, y: -80, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{
                opacity: 0,
                y: -10,
                transition: {
                  duration: 0.15,
                  ease: "easeOut"
                }
              }}

              transition={{
                type: "spring",
                stiffness: 1000,
                damping: 25,
                mass: 0.8
              }}
            >
              <div className="flex flex-col text-sm text-gray-700">

                {/* <button className="px-4 py-3 hover:bg-gray-100 text-left">
                  View Channel Info
                </button>

                <button className="px-4 py-3 hover:bg-gray-100 text-left">
                  Mute Notifications
                </button> */}

                {/* <button className="px-4 py-3 hover:bg-gray-100 text-left text-red-500">
                  Leave Channel
                </button> */}
                {BroadCastChannel === true ? (
                  <div
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-3 hover:bg-gray-100 text-left text-red-500 cursor-pointer"
                  >
                    Delete Broadcast
                  </div>
                ) : isAdmin ? (
                  <div
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-3 hover:bg-gray-100 text-left text-red-500 cursor-pointer"
                  >
                    Delete Channel
                  </div>
                ) : (
                  <div
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-3 hover:bg-gray-100 text-left text-red-500 cursor-pointer"
                  >
                    Leave Channel
                  </div>
                )}


              </div>
            </motion.div>
          </>
        )}

        {showInfo && (
          <>
            {/*  BACKDROP (light, optional) */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-[190]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
            />

            {/*  SLIDER PANEL */}
            <motion.div
              className="fixed top-0 right-0 h-screen w-[350px] bg-white z-[200] shadow-2xl flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{
                x: "100%",
                transition: { duration: 0.25, ease: "easeInOut" }
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              {/* HEADER */}
              <div className="p-4 border-b flex items-center justify-between">
                <span className="font-semibold text-lg">Channel Info</span>
                <i
                  onClick={() => setShowInfo(false)}
                  className="fa-solid fa-xmark cursor-pointer text-lg"
                ></i>
              </div>

              {/* CONTENT */}
              <div className="p-4 flex flex-col gap-4 overflow-y-auto">

                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl">
                    <i className="fa-solid fa-bullhorn"></i>
                  </div>

                  <span className="font-semibold text-lg">
                    {channel?.name}
                  </span>

                  <span className="text-sm text-gray-500">
                    {channel?.totalSubscribers} subscribers
                  </span>
                </div>

                <div className="text-sm text-gray-600">
                  {channel?.description || "No description"}
                </div>

                <div className="flex flex-col ">
                  <div className="flex gap-10 items-center cursor-pointer hover:bg-blue-100 py-1 px-2 rounded-md">
                    <i className="fa-solid fa-photo-film"></i>
                    <span>Photos</span>
                  </div>
                  <div className="flex gap-10 items-center cursor-pointer hover:bg-blue-100 py-1 px-2 rounded-md ">
                    <i className="fa-solid fa-video"></i>
                    <span>Videos</span>
                  </div>
                  <div className="flex gap-10 items-center cursor-pointer hover:bg-blue-100 py-1 px-2 rounded-md">
                    <i className="fa-solid fa-link"></i>
                    <span>Share links</span>
                  </div>
                  <div className="flex gap-10 items-center cursor-pointer hover:bg-blue-100 py-1 px-2 rounded-md">
                    <i className="fa-solid fa-square-poll-vertical"></i>
                    <span>Polls</span>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}

        {showPinned && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 z-[190]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPinned(false)}
            >
              <motion.div
                className="fixed top-0 right-0 h-screen w-[350px] bg-white z-[200] shadow-2xl flex flex-col"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{
                  x: "100%",
                  transition: { duration: 0.25, ease: "backInOut" }
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
              >
                {pinnedMessages.length === 0 ? (
                  <div>
                    No Pinned
                  </div>
                ) :
                  pinnedMessages.map((d, i) => (
                    <div className="mt-auto px-3 py-3">
                      <div className="bg-blue-400 rounded-lg font-semibold text-lg flex items-center justify-between">
                        <p className=" px-3 py-2 ">{d.text}</p>
                        {isAdmin && (
                          <i
                            onClick={(e) => {
                              e.stopPropagation();

                              const current = pinnedMessages[activePinIndex];

                              socket.emit("unpin_channel_message", {
                                channelId: channelid,
                                messageId: current._id,
                              });
                            }}
                            className="fa-solid fa-xmark text-sm text-white font-semibold ml-2 px-1 py-4 bg-red-600 cursor-pointer "
                          ></i>
                        )}
                      </div>
                    </div>
                  ))

                }
              </motion.div>
            </motion.div>
          </>
        )}
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="bg-white rounded-xl p-5 w-[300px] flex flex-col gap-4 shadow-xl"
            >

              {/* TITLE */}
              <h2 className="font-semibold text-lg text-center">
                {BroadCastChannel
                  ? "Delete Broadcast?"
                  : isAdmin
                    ? "Delete Channel?"
                    : "Leave Channel?"}
              </h2>

              {/* MESSAGE */}
              <p className="text-sm text-gray-500 text-center">
                {isAdmin || BroadCastChannel
                  ? "This action cannot be undone."
                  : "You can join again later."}
              </p>

              {/* ACTIONS */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 rounded-md bg-gray-200"
                >
                  No
                </button>

                <button
                  onClick={() => {
                    handleLeaveChannel();
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 py-2 rounded-md bg-red-500 text-white"
                >
                  Yes
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
