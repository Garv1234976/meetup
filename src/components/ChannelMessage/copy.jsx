import { AnimatePresence, motion } from "framer-motion";
import { Theme } from "../../theme/globalTheme";
import { useEffect, useState } from "react";

import Sealion from '/sealion.jpg';
import { useSocket } from "../../context/SocketContext";
import { useRef } from "react";
export function ChannelMessage({ channelid, fullchannelobject, onBack }) {
  const channel = fullchannelobject;
  const { socket, isReady } = useSocket();
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [message, setMessage] = useState("");
  const [command, setCommand] = useState(false);

  const [getPreviewData, setGetPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState(null);
  const [reactionMenuOpenIndex, setReactionMenuOpenIndex] = useState(null);

  const isSelectingRef = useRef()

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
    if (!socket) return;

    const handlePreview = (data) => {
      // console.log("PREVIEW:", data);
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
    if (!message.trim()) return;

    const newMessage = {
      text: message,
      preview: getPreviewData,
      time: new Date().toLocaleTimeString(),
      reactions: {
        "😭": 0,
        "😎": 0,
        "🫤": 0,
        "🫏": 0,
        "🥲": 0,
      },
    };

    setMessages((prev) => [...prev, newMessage]);

    // reset
    setMessage("");
    setGetPreviewData(null);
    setShowPreview(false);
  };
  const handleReaction = (msgIndex, emoji) => {
    setMessages((prev) => {
      const updated = [...prev];

      if (!updated[msgIndex].reactions) {
        updated[msgIndex].reactions = {};
      }

      updated[msgIndex].reactions[emoji] =
        (updated[msgIndex].reactions[emoji] || 0) + 1;

      return updated;
    });
  };
  return (
    <>
      <AnimatePresence>
        <div
          className="max-md:hidden w-[65%] h-screen flex flex-col"
          style={{ backgroundColor: Theme.primaryBackgroundColor }}
        >
          {/*  HEADER (same as chat) */}
          <header className="sticky top-0 bg-white shadow-sm px-3 pt-3 flex items-center gap-3 ">

            <i
              onClick={onBack}
              className="fa-solid fa-arrow-left text-xl cursor-pointer"
            ></i>

            <div className="flex justify-between w-full pb-1">
              <div className="flex gap-2">
                {/* CHANNEL ICON */}
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <i className="fa-solid fa-bullhorn"></i>
                </div>

                {/* CHANNEL INFO */}
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">
                    {channel?.name}
                  </span>

                  <span className="text-xs text-gray-500">
                    {channel?.totalSubscribers} subscribers
                  </span>
                </div>
              </div>


              <div className="flex items-center gap-4">
                <i className="fa-solid fa-magnifying-glass text-lg text-blue-400 hover:text-black cursor-pointer h-10 pt-3 "></i>
                <i onClick={() => setShowInfo(true)} className="fa-solid fa-table-columns text-lg text-blue-400 hover:text-black cursor-pointer h-10 pt-3"></i>
                <i onClick={() => setShowMenu(true)} className="fa-solid fa-ellipsis text-lg text-blue-400 hover:text-black cursor-pointer h-10 pt-3"></i>
              </div>
            </div>
          </header>

          <motion.div>
            <div>
              <div className="px-3 py-1 bg-blue-400 flex gap-1" style={{ background: Theme.thirdBackgroundColor }}>
                <div className="flex gap-1  w-full">
                  <motion.div
                    className="flex flex-col gap-0.5">
                    <div className="w-0.5 h-5 rounded-full bg-[#00d9ff]"></div>
                    <div className="w-0.5 h-5 rounded-full bg-[#8e8e8e]"></div>
                  </motion.div>
                  <div className="flex flex-col leading-none gap-1">
                    <span className="text-[16px] font-semibold">Pinned Message</span>
                    <span className="text-sm">https://buddiespay.online/bpxadmin/fr-txnTransaction.php</span>
                  </div>
                </div>
                <div onClick={() => setShowPinned(true)} className="flex items-center cursor-pointer">
                  <i className="fa-solid fa-thumbtack rotate-60 text-lg text-[#383333]"></i>
                </div>
              </div>
            </div>
          </motion.div>
          {/*  BODY (EMPTY STATE FOR NOW) */}
          <main className="flex-1 flex px-6 ">
            {/* <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >

              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl">
                <i className="fa-solid fa-bullhorn"></i>
              </div>

              <h2 className="text-xl font-semibold text-gray-700">
                {channel?.name}
              </h2>

              <p className="text-sm text-gray-500 max-w-md">
                {channel?.description || "No description available"}
              </p>

              <div className="text-xs text-gray-400">
                Created at:{" "}
                {new Date(channel?.createdAt).toLocaleDateString()}
              </div>


              <div className="mt-4 text-gray-400 text-sm">
                No messages yet 🚀
              </div>
            </motion.div> */}

            <div className="w-full relative flex flex-col gap-1 h-[78vh]  overflow-y-scroll" style={{ scrollbarWidth: 'none' }}>
              <div className="flex flex-col justify-end min-h-full gap-2">
                <div className="absolute top-0 right-[50%] ">
                  <span className="bg-gray-500 font-semibold text-sm px-2 rounded-md text-white">
                    April 6, 2026
                  </span>
                </div>
                {/* This is for Simple Messge with Emoji Reaction with views with time */}
                {/* <div className="bg-blue-400 px-3 rounded flex flex-col">
                <span className="font-semibold text-sm mt-2 text-amber-900">{channel?.name}</span>
                <span>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aliquid fugit, impedit asperiores expedita saepe nemo molestiae modi quasi debitis pariatur ratione incidunt nihil consequuntur. Atque aspernatur inventore id vel architecto?</span>
                <div className="flex justify-between items-center py-1 ">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-300 px-1 rounded-2xl">😭 20</span>
                    <span className="bg-blue-300 px-1 rounded-2xl">😎 20</span>
                    <span className="bg-blue-300 px-1 rounded-2xl">🫤 20</span>
                    <span className="bg-blue-300 px-1 rounded-2xl">🫏 20</span>
                    <span className="bg-blue-300 px-1 rounded-2xl">🥲 20</span>
                  </div>
                  <div className="flex gap-4 items-center text-gray-300 font-semibold text-sm">
                    <span>
                      <i className="fa-solid fa-eye mr-2"></i>
                      216.2k</span>
                    <span>22:01</span>
                  </div>
                </div>
              </div> */}

                {/* This is for Preview for the openGrapql n get the information from the Youtube also a link previewer*/}
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{
                      type: "spring",
                      stiffness: 600,
                      damping: 35,
                    }}
                    className="flex items-end -mb-1 gap-3"
                  >
                    {/* 💬 MESSAGE */}
                    <div className="relative bg-blue-400 px-3 py-2 rounded-2xl flex flex-col max-w-[75%]">

                      {/* CHANNEL NAME */}
                      <span className="font-semibold text-sm text-amber-900">
                        {channel?.name}
                      </span>

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
                          <div className="w-60 bg-blue-300 border-l-4 rounded-l-lg rounded-r-md my-2 flex flex-col">

                            <span className="px-2 font-semibold text-sm text-amber-900">
                              {msg.preview.siteName}
                            </span>

                            <span className="text-sm font-semibold px-2 line-clamp-2">
                              {msg.preview.title}
                            </span>

                            {msg.preview.images?.[0] && (
                              <img
                                src={msg.preview.images[0]}
                                className="w-full object-cover rounded-bl-lg rounded-r-md"
                              />
                            )}
                          </div>
                        </a>
                      )}

                      {/* MESSAGE TEXT */}
                      <span>{msg.text}</span>



                      {/*  REACTION PILLS (BOTTOM LEFT) */}
                      {msg.reactions && Object.values(msg.reactions).some(v => v > 0) && (
                        <div className="absolute bottom-1 left-2  gap-1 grid grid-cols-4">
                          {Object.entries(msg.reactions)
                            .filter(([_, count]) => count > 0)
                            .map(([emoji, count]) => (
                              <span
                                key={emoji}
                                className="bg-white px-2 py-[2px] rounded-full text-xs shadow flex items-center gap-1"
                              >
                                {emoji} {count}
                              </span>
                            ))}
                        </div>
                      )}

                      {/* FOOTER */}
                      <div className="flex justify-end text-xs text-gray-200 mt-1">
                        {msg.time}
                      </div>

                      {/* 🔻 MESSAGE TAIL */}
                      {/* <div className="absolute -bottom-1 left-3 w-3 h-3 bg-blue-400 rotate-45"></div> */}
                    </div>

                    <div className="flex flex-col items-start gap-3">
                      {/* 🟡 REACTION POPUP (TOP FLOATING) */}
                      {reactionMenuOpenIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, y:30, scale: 0.8 }}
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

                      <div
                        onClick={() =>
                          setReactionMenuOpenIndex(
                            reactionMenuOpenIndex === index ? null : index
                          )
                        }
                        className="bg-white px-1 rounded-full shadow cursor-pointer hover:scale-110 transition flex items-center gap-1"
                      >
                        😊
                        <i className="fa-solid fa-chevron-down text-xs"></i>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* This is for assests and the files download preview  */}
                {/* <div>
                <div className="bg-blue-400 px-3 rounded flex flex-col">
                  <span className="font-semibold text-sm mt-2 text-amber-900">{channel?.name}</span>

                  <div className="flex gap-4">

                    <div className="w-30 bg-blue-300 my-2 flex">
                      <div className="relative flex items-center justify-center">
                        <i className="absolute fa-solid fa-arrow-down bg-gray-400 px-4 py-1 text-center rounded-full"></i>
                        <img src={Sealion} alt="" className="w-full object-contain " />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="font-semibold">This is Pdf file.pdf</span>
                      <span className="text-xs font-semibold">2.2 MB</span>
                    </div>
                  </div>


                  <span>Lorem, ipsum dolor sit amet consectetur adipisicing elit.</span>
                  <div className="flex justify-between items-center py-1 ">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-300 px-1 rounded-2xl">😭 20</span>
                      <span className="bg-blue-300 px-1 rounded-2xl">😎 20</span>
                      <span className="bg-blue-300 px-1 rounded-2xl">🫤 20</span>
                      <span className="bg-blue-300 px-1 rounded-2xl">🫏 20</span>
                      <span className="bg-blue-300 px-1 rounded-2xl">🥲 20</span>
                    </div>
                    <div className="flex gap-4 items-center text-gray-300 font-semibold text-sm">
                      <span>
                        <i className="fa-solid fa-eye mr-2"></i>
                        216.2k</span>
                      <span>22:01</span>
                    </div>
                  </div>
                </div>
              </div> */}

              </div>
            </div>
          </main>

          {/*  FOOTER (DISABLED INPUT FOR NOW) */}
          <div className="absolute bottom-20 right-2">
            <div className="bg-[#00d9ff] p-3 w-10 h-10 rounded-full ">
              <i className="fa-solid fa-chevron-down font-semibold"></i>
            </div>
          </div>
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

                  {getPreviewData.images?.[0] && (
                    <img
                      src={getPreviewData.images[0]}
                      className="w-full h-32 object-cover"
                    />
                  )}

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
          <footer className="p-4 border-t bg-white flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              placeholder="Only admin can send messages"
              className="flex-1 px-4 py-2 rounded-full bg-gray-100 text-gray-400 outline-none"
            />
            <button
              disabled
              className="bg-gray-300 px-4 py-2 rounded-full text-white"
            >
              Send
            </button>
          </footer>
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

                <button className="px-4 py-3 hover:bg-gray-100 text-left">
                  View Channel Info
                </button>

                <button className="px-4 py-3 hover:bg-gray-100 text-left">
                  Mute Notifications
                </button>

                <button className="px-4 py-3 hover:bg-gray-100 text-left text-red-500">
                  Leave Channel
                </button>

              </div>
            </motion.div>
          </>
        )}
        {/* </AnimatePresence> */}
        {/* </AnimatePresence> */}
        {/* <AnimatePresence> */}
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
        {/* </AnimatePresence> */}

        {/* <AnimatePresence> */}
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
                <div>
                  <p>This is the panel that i got </p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}