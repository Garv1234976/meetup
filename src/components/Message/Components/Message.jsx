import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../../context/AuthContex";
import { Theme } from "../../../theme/globalTheme";
import {
  addMessage,
  setLastMessage,
  toggleReaction,
} from "../../../redux/features/chats/chatSlice";
import { fetchLastTwoDaysMessages } from "../../../redux/features/chats/chatThunks";
import { formatDateHeader } from "../../../../utils/DateFormater";
import { useTyping } from "../../../context/TypingContext";
import { useSocket } from "../../../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const htmlToText = (html) => {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<strong>|<\/strong>/gi, "")
    .replace(/<b>|<\/b>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
const SkeletonBubble = ({ isFromFriend }) => {
  return (
    <div
      className={`flex ${isFromFriend ? "justify-start" : "justify-end"} px-3`}
    >
      <motion.div
        className={`relative overflow-hidden rounded-2xl ${isFromFriend ? "rounded-tl-none" : "rounded-tr-none"
          }`}
        style={{
          height: `${Math.random() * 40 + 20}px`,
          width: `${Math.random() * 120 + 110}px`,
          background: "#e5e7eb",
        }}
      >
        {/* SHIMMER LAYER */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
          }}
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  );
};
export function Messaging({ slectedFriends, onBack }) {
  // console.log("This is the Message compo",JSON.stringify(slectedFriends));
  const { socket, isReady,setActiveChat, setChatUnread,chatMessages  } = useSocket();
  const { user } = useAuth();
  const { updateTyping } = useTyping();
  const currentUserId = user?._id;
  const dispatch = useDispatch();
   const messages = useSelector((state) => state.chat.messages);
  // const messages = chatMessages[slectedFriends.chatId] || [];
// 
  const [message, setMessage] = useState("");
  const [typingUserId, setTypingUserId] = useState(null);
  const [suggestText, setSuggestText] = useState([]);
  const isSelectingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const [command, setCommand] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [reactionMenuOpenId, setReactionMenuOpenId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [broadcastSeenMap, setBroadcastSeenMap] = useState({});
  // const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const navigate = useNavigate();
  // Fetch messages on chat change

useEffect(() => {
  if (!slectedFriends?.chatId) return;

  setActiveChat(slectedFriends.chatId);

  return () => setActiveChat(null);
}, [slectedFriends?.chatId]);


  useEffect(() => {
    if (!slectedFriends?.chatId) return;

    setLoadingMessages(true); // 🔥 ADD THIS

    dispatch(fetchLastTwoDaysMessages(slectedFriends.chatId))
      .finally(() => setLoadingMessages(false));

  }, [slectedFriends?.chatId]);

  useEffect(() => {
    if (!socket || !slectedFriends?.chatId) return;
    const handleMessage = (data) => {
      const isThisChat =
        (data.from === slectedFriends._id && data.to === currentUserId) ||
        (data.from === currentUserId && data.to === slectedFriends._id);

      if (isThisChat) {
        dispatch(addMessage(data));
      }
    };

    // debounce

    let typingTimeout;
    const handleTyping = ({ chatId, senderId }) => {
      if (chatId === slectedFriends.chatId && senderId !== currentUserId) {
        setTypingUserId(senderId);
        updateTyping(senderId, true);

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          updateTyping(senderId, false);
          setTypingUserId(null);
        }, 1000);
      }
    };

    const handleStopTyping = ({ chatId, senderId }) => {
      if (chatId === slectedFriends.chatId && senderId !== currentUserId) {
        // no need to do anything here if you're using updateTyping
      }
    };

    socket.on("receive_message", handleMessage);
    socket.on("user typing", handleTyping);
    socket.on("user stop typing", handleStopTyping);
    socket.on("suggestions", (suggestions) => {
      setSuggestText(suggestions);
    });
    return () => {
      socket.off("receive_message", handleMessage);
      socket.off("user typing", handleTyping);
      socket.off("user stop typing", handleStopTyping);
      socket.off("suggestions");
    };
  }, [socket, slectedFriends, currentUserId, dispatch]);

  const groupedMessages = useMemo(() => {
    const groups = {};
    for (const msg of messages) {
      const header = formatDateHeader(msg.timestamp);
      if (!groups[header]) groups[header] = [];
      groups[header].push(msg);
    }
    return groups;
  }, [messages]);
  // Auto scroll to bottom
  useEffect(() => {
    const prevCount = prevMsgCountRef.current;
    const currentCount = messages.length;

    const isNewChat = prevCount === 0 && currentCount > 0;
    const isNewMessage = currentCount > prevCount;

    if (isNewChat || isNewMessage) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0); //  wait for DOM paint
    }

    prevMsgCountRef.current = currentCount;
  }, [messages]);

  useEffect(() => {
    prevMsgCountRef.current = 0;

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 50); // small delay for fetch render
  }, [slectedFriends?._id]);

  /**
   *  actions and commands
   * @param {*} e
   * @returns
   */

  const commandsAction = ["/confetti"];

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    if (value.startsWith("/")) {
      setCommand(true);
    } else if (value.trim() === "") {
      setCommand(false);
    } else setCommand(false);

    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }
    if (!socket || !slectedFriends.chatId) return;

    socket.emit("typing", {
      chatId: slectedFriends.chatId,
      senderId: currentUserId,
    });

    socket.emit("suggest", value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", {
        chatId: slectedFriends.chatId,
        senderId: currentUserId,
      });
    }, 400);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;

    if (message.trim() === "/confetti") {
      import("canvas-confetti").then((confetti) => {
        confetti.default({
          angle: 120,
          spread: 100,
          particleCount: 300,
          origin: { x: 1, y: 1 },
        });
      });
      setMessage("");
      setCommand(false);
      return;
    }

    dispatch(setLastMessage(message));
    const newMsg = {
      _id: "temp-" + Date.now(),
      from: currentUserId,
      to: slectedFriends._id,
      text: message,
      timestamp: new Date().toISOString(),
      reactions: [],
    };

    socket.emit("send_message", newMsg);
    dispatch(addMessage(newMsg));
    setMessage("");
    setSuggestText([]);
  };

  const handleReaction = (messageId, emoji) => {
    // 🔥 instant UI update (sender side)
    dispatch(toggleReaction({
      messageId,
      emoji,
      userId: currentUserId,
      chatId: slectedFriends.chatId
    }));

    // 🔥 send to server
    socket.emit("react_message", {
      messageId,
      emoji,
      chatId: slectedFriends.chatId,
      to: slectedFriends._id
    });
  };

  useEffect(() => {
    if (!socket) return;

    const onReaction = ({ messageId, emoji, userId, chatId }) => {
      if (userId === currentUserId) return;

      dispatch(toggleReaction({ messageId, emoji, userId, chatId }));
    };

    socket.on("message_reaction", onReaction);

    return () => {
      socket.off("message_reaction", onReaction);
    };
  }, [socket, dispatch]);

  useEffect(() => {
    setHoveredMessageId(null);
    setReactionMenuOpenId(null);
  }, [messages]);


  useEffect(() => {
    if (!socket || !messages) return;

    messages.forEach((msg) => {
      if (msg.broadcastId) {
        // console.log("📡 sending seen:", msg.broadcastId);
        socket.emit("broadcast_seen", {
          broadcastId: msg.broadcastId,
        });
      }
    });
  }, [messages]);
  const confirmRemoveFriend = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/friends/${slectedFriends._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json();

      setShowRemoveModal(false);
      onBack();

    } catch (err) {
      console.log("Remove failed");
    }
  };


  const handleRemoveFriend = () => {
    setShowRemoveModal(true);
  };

  return (
    <>
      <div
        className="w-[100%] h-screen flex flex-col relative"
        style={{ backgroundColor: Theme.primaryBackgroundColor }}
      >
        {/* Header */}
        <header className="sticky top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center gap-3 z-10 border-b border-gray-100 dark:border-gray-700">
          <i
            onClick={() => {
              onBack();
              navigate("/chats", { replace: true });
            }}
            className="fa-solid fa-arrow-left text-xl text-white cursor-pointer"
          ></i>

          {loadingMessages ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden relative">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                  }}
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              </div>
            </div>
          ) : (
            <img
              src={slectedFriends.picture}
              alt="profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-100 dark:border-gray-600"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-100 capitalize ">
                {slectedFriends.name}
              </span>
              <span className="w-2 h-2 bg-green-500 rounded-full "></span>
              {/* {!off ? <span className="w-2 h-2 bg-green-500 rounded-full "></span> : <span className="w-2 h-2 rounded-full bg-green-500"></span>} */}
            </div>
            {typingUserId === slectedFriends._id && (
              <span className=" absolute text-xs text-gray-500 dark:text-gray-400">
                Typing...
              </span>
            )}
          </div>

          <div>
            <button
              onClick={handleRemoveFriend}
              className="ml-auto text-red-500 cursor-pointer"
            >
              <i className="fa-solid fa-user-minus text-xl"></i>
            </button>
          </div>

        </header>

        {/* Messages Container */}
        <main className="flex-1 pt-4 pb-10 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-blue-300 dark:scrollbar-thumb-blue-600 scrollbar-track-transparent">
          {loadingMessages ? (
            <>
              {[...Array(8)].map((_, i) => (
                <SkeletonBubble key={i} isFromFriend={i % 2 === 0} />
              ))}
            </>
          ) : (
            <>
              {Object.entries(groupedMessages).map(([dateHeader, msgs]) => (
                <div key={dateHeader} className="flex flex-col px-4 mb-4">
                  {/* Date header */}
                  <div className="sticky top-0 z-10 text-center mx-auto mb-3">
                    <span className="inline-block bg-gray-100 dark:bg-gray-700 text-xs font-medium py-1 px-3 rounded-full text-gray-600 dark:text-gray-300">
                      {dateHeader}
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="flex flex-col gap-5">
                    {msgs.map((msg, index) => {
                      const isFromFriend =
                        (msg.sender && msg.sender === slectedFriends._id) ||
                        (msg.from && msg.from === slectedFriends._id);

                      return (
                        <div
                          key={msg._id || msg.timestamp}
                          className={`flex w-full  ${isFromFriend ? "justify-start" : "justify-end"
                            }`}
                          onMouseEnter={() => setHoveredMessageId(msg._id)}
                          onMouseLeave={() => {
                            setHoveredMessageId(null);
                            setReactionMenuOpenId(null);
                          }}
                        >
                          {/* MESSAGE ROW */}
                          <div
                            className={`flex items-center max-w-[80%] md:max-w-[65%] ${isFromFriend ? "flex-row-reverse" : "flex-row"
                              }`}
                          >
                            {/* EMOJI BUTTON (HOVER ONLY) */}
                            <div
                              className={`relative transition-all duration-200 cursor-pointer ${hoveredMessageId === msg._id
                                ? "opacity-100 scale-100"
                                : "opacity-100 scale-75"
                                } ${isFromFriend ? "ml-1" : "mr-1"}`}
                            >
                              <div
                                className="px-2 py-1 bg-white/80 backdrop-blur rounded-full shadow cursor-pointer flex items-center gap-1"
                                onClick={() =>
                                  setReactionMenuOpenId(
                                    reactionMenuOpenId === msg._id
                                      ? null
                                      : msg._id,
                                  )
                                }
                              >
                                😊
                                <i className="fa-solid fa-chevron-down text-xs"></i>
                              </div>

                              {/* REACTION MENU */}
                              <AnimatePresence>
                                {reactionMenuOpenId === msg._id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.6, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.6, y: 10 }}
                                    transition={{
                                      duration: 0.2,
                                      ease: "easeOut",
                                    }}
                                    className={`absolute bottom-full mb-2 flex gap-2 bg-white p-2 rounded-full shadow-lg origin-bottom ${isFromFriend ? "left-0" : "right-0"
                                      }`}
                                  >
                                    {["❤️", "😂", "👍", "😢"].map((emoji) => (
                                      <span
                                        key={emoji}
                                        className="cursor-pointer text-lg hover:scale-125 transition"
                                        onClick={() =>
                                          handleReaction(msg._id, emoji)
                                        }
                                      >
                                        {emoji}
                                      </span>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* MESSAGE BUBBLE */}
                            <div
                              className={`px-4 py-2 text-sm rounded-2xl shadow-md relative break-words whitespace-pre-wrap max-w-xl ${isFromFriend
                                ? "bg-white text-gray-800 rounded-tl-none"
                                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none"
                                }`}
                            >
                              {/* TEXT */}
                              {msg?.broadcastId ? (
                                <pre className="whitespace-pre-wrap break-words font-sans">
                                  {htmlToText(msg.text)}
                                </pre>
                              ) : (
                                <span className="font-semibold">
                                  {msg.text}
                                </span>
                              )}
                              {/* TIME */}
                              <div
                                className={`text-[10px] mt-1 ${isFromFriend
                                  ? "text-gray-500"
                                  : "text-blue-100"
                                  } text-right`}
                              >
                                {new Date(msg.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>

                              {/* REACTIONS DISPLAY */}
                              {msg.reactions?.length > 0 && (
                                <motion.div
                                  initial={{ scale: 0, y: 10 }}
                                  animate={{ scale: 1, y: 0 }}
                                  exit={{ scale: 0, y: 10 }}
                                  className={`absolute -bottom-2 ${isFromFriend ? "left-2" : "right-2"
                                    } flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-[2px] rounded-full shadow-md`}
                                >
                                  {[
                                    ...new Set(
                                      msg.reactions.map((r) => r.emoji),
                                    ),
                                  ].map((emoji, i) => (
                                    <span key={i} className="text-xs">
                                      {emoji}
                                    </span>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Typing Indicator */}
        {typingUserId === slectedFriends._id && (
          <div className="absolute bottom-20 left-4  px-2 py-1 rounded-full  text-sm text-gray-600 dark:text-gray-300">
            <span className="flex items-center ">
              <div class="de">
                <div class="bou"></div>
                <div class="bou2"></div>
                <div class="bou3"></div>
              </div>
            </span>
          </div>
        )}

        {/* Message Input */}
        {command &&
          commandsAction.map((value) => (
            <div key={value} className="p-1 ">
              <div className="flex gap-2 p-2  justify-end bg-gray-200 ">
                <div
                  className="border-b"
                  onClick={() => {
                    isSelectingRef.current = true;
                    setMessage(value);
                    setSuggestText([]);
                  }}
                >
                  {value}
                </div>
                <div className="text-[10px] ">
                  <button className="bg-gray-700 p-0.5 text-white font-medium rounded">
                    Enter
                  </button>
                </div>
              </div>
            </div>
          ))}
        <footer
          className="sticky bottom-0 w-full px-4 py-3 border-t  border-gray-100 dark:border-gray-700 "
          style={{ backgroundColor: Theme.thirdBackgroundColor }}
        >
          <div className="flex justify-center gap-10 mb-1 ">
            {suggestText.slice(0, 3).map((suggest, index) => (
              <div
                key={index}
                className="bg-blue-400 text-sm text-white p-1 rounded-md font-medium"
                onClick={() => {
                  isSelectingRef.current = true;
                  setMessage(suggest);
                  setSuggestText([]);
                }}
              >
                {suggest}
              </div>
            ))}
          </div>
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 bg-white dark:bg-gray-700 p-2 rounded-full"
          >
            <button
              type="button"
              className="text-blue-500 dark:text-blue-400 p-1"
            >
              <i className="fa-regular fa-face-smile text-xl"></i>
            </button>
            <input
              type="text"
              placeholder="Write a message... or type / for cmd"
              value={message}
              onChange={handleInputChange}
              onBlur={() =>
                socket.emit("stop typing", {
                  chatId: slectedFriends.chatId,
                  senderId: currentUserId,
                })
              }
              className="flex-1 px-3 py-2 outline-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-white"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full text-white font-medium text-sm transition-colors"
            >
              <span className="hidden md:block">Send</span> <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </form>
        </footer>
      </div>
      <AnimatePresence>
        {showRemoveModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-xl w-[300px] text-center"
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 40 }}
            >
              <div className="text-2xl mb-2">⚠️</div>

              <h2 className="text-lg font-semibold mb-2">
                Remove Friend?
              </h2>

              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to remove this friend?
              </p>

              <div className="flex gap-3 justify-center">

                {/* Cancel */}
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="bg-gray-300 px-3 py-1 rounded-md text-sm"
                >
                  Cancel
                </button>

                {/* Confirm */}
                <button
                  onClick={confirmRemoveFriend}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                >
                  Remove
                </button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
