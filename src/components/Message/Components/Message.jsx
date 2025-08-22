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
export function Messaging({ slectedFriends }) {
  const { socket, isReady } = useSocket();
  const { user } = useAuth();
  const { updateTyping } = useTyping();
  const currentUserId = user?._id;
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.chat.messages);

  const [message, setMessage] = useState("");
  const [typingUserId, setTypingUserId] = useState(null);
  const [suggestText, setSuggestText] = useState([]);
  const isSelectingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const [command, setCommand] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [reactionMenuOpenId, setReactionMenuOpenId] = useState(null);

  // const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  // Socket connection (only once)
  // useEffect(() => {
  //   socketRef.current = io(SOCKET_URL, { withCredentials: true });

  //   return () => {
  //     socketRef.current.disconnect();
  //   };
  // }, []);

  // Fetch messages on chat change
  useEffect(() => {
    if (slectedFriends?.chatId) {
      dispatch(fetchLastTwoDaysMessages(slectedFriends.chatId));
    }
  }, [slectedFriends, dispatch]);

  // Handle incoming messages & typing indicators
  // useEffect(() => {
  //   const socket = socketRef.current;

  //   const handleMessage = (data) => {
  //     if (data.from === slectedFriends._id) {
  //       dispatch(addMessage(data));
  //     }
  //   };

  //   const handleTyping = ({ chatId, senderId }) => {
  //     if (chatId === slectedFriends.chatId && senderId !== currentUserId) {
  //       setTypingUserId(senderId);
  //     }
  //     updateTyping(senderId, true)
  //     setTimeout(() => updateTyping(senderId, false), 400);
  //   };

  //   const handleStopTyping = ({ chatId, senderId }) => {
  //     if (chatId === slectedFriends.chatId && senderId !== currentUserId) {
  //       setTypingUserId(null);
  //     }
  //   };

  //   socket.on("receive_message", handleMessage);
  //   socket.on("user typing", handleTyping);
  //   socket.on("user stop typing", handleStopTyping);

  //   return () => {
  //     socket.off("receive_message", handleMessage);
  //     socket.off("user typing", handleTyping);
  //     socket.off("user stop typing", handleStopTyping);
  //   };
  // }, [slectedFriends, currentUserId, dispatch]);

  useEffect(() => {
    if (!socket || !slectedFriends?.chatId) return;

    const handleMessage = (data) => {
      if (data.from === slectedFriends._id) {
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
      //   socket.off('suggestions', (sug) => {
      //   sug.forEach(element => {
      //     console.log(element)
      //   });
      // })
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   *  actions and commands
   * @param {*} e
   * @returns
   */
  // heper funtion
  // function randompos(min, max) {
  //   return Math.random() * (max - min) + min;
  // }
  // "/confetti": (confetti) =>
  //   confetti.default({
  //     angle: randompos(55, 125),
  //     spread: randompos(50, 70),
  //     particleCount: randompos(50, 100),
  //     origin: { y: 0.6 },
  //   }),
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
    socket.emit("react_message", {
      messageId,
      emoji,
      userId: currentUserId,
    });

    dispatch(toggleReaction({ messageId, emoji, userId: currentUserId }));
  };

  useEffect(() => {
    if (!socket) return;

    const onReaction = ({ messageId, emoji, userId }) => {
      dispatch(toggleReaction({ messageId, emoji, userId }));
    };

    socket.on("message_reaction", onReaction);

    return () => {
      socket.off("message_reaction", onReaction);
    };
  }, [socket, dispatch]);

  return (
    <>
      <div
        className="max-md:hidden w-[65%] h-screen flex flex-col relative"
        style={{ backgroundColor: Theme.primaryBackgroundColor }}
      >
        {/* Header */}
        <header className="sticky top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center gap-3 z-10 border-b border-gray-100 dark:border-gray-700">
          <img
            src={slectedFriends.picture}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-100 dark:border-gray-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-100">
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
        </header>

        {/* Messages Container */}
        <main className="flex-1 pt-4 pb-10 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-blue-300 dark:scrollbar-thumb-blue-600 scrollbar-track-transparent">
          {Object.entries(groupedMessages).map(([dateHeader, msgs]) => (
            <div key={dateHeader} className="flex flex-col px-4 mb-4">
              {/* Date header */}
              <div className="sticky top-0 z-0 text-center mx-auto mb-3">
                <span className="inline-block bg-gray-100 dark:bg-gray-700 text-xs font-medium py-1 px-3 rounded-full text-gray-600 dark:text-gray-300">
                  {dateHeader}
                </span>
              </div>

              {/* Messages */}
              <div className="flex flex-col gap-2">
                {msgs.map((msg, index) => {
                  const isFromFriend =
                    (msg.sender && msg.sender === slectedFriends._id) ||
                    (msg.from && msg.from === slectedFriends._id);
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 ${
                        isFromFriend ? "justify-start" : "justify-end"
                      }`}
                      onMouseEnter={() => setHoveredMessageId(msg._id)}
                      onMouseLeave={() => {
                        setHoveredMessageId(null);
                        setReactionMenuOpenId(null);
                      }}
                    >
                      {/* <div className="relative group">
                        <div className="px-2  bg-gray-200 rounded-full text-blue-500 cursor-pointer">
                          <i className="fa-solid fa-face-grin text-xs"></i>
                          <i className="fa-solid fa-chevron-down text-xs ml-1"></i>
                        </div>

                        
                        <div className="absolute bottom-full mb-2 flex gap-1 bg-white dark:bg-gray-200 p-1 rounded shadow ">
                          {["❤️", "😂", "👍", "😢"].map((emoji) => (
                            <span
                              key={emoji}
                              className="cursor-pointer text-lg relative hover:scale-200  "
                              onClick={() => handleReaction(msg._id, emoji)}
                            >
                              {emoji}
                            </span>
                          ))}
                        </div>
                      </div> */}
                      
                      {hoveredMessageId === msg._id && (
                        <div className="relative">
                          <div
                            className={`px-2 py-1 bg-gray-200 rounded-full text-blue-500 cursor-pointer flex items-center gap-1  `}
                            onClick={() => {
                              if (reactionMenuOpenId === msg._id) {
                                setReactionMenuOpenId(null);
                              } else {
                                setReactionMenuOpenId(msg._id);
                              }
                            }}
                          >
                            <i className="fa-solid fa-face-grin text-xs"></i>
                            <i className="fa-solid fa-chevron-down text-xs ml-1"></i>
                          </div>

                          {reactionMenuOpenId === msg._id && (
  <div
    className={`
      absolute 
      bottom-full 
      mb-2 
      flex gap-1 
      bg-white dark:bg-gray-200 
      p-1 rounded shadow z-10
      ${isFromFriend ? "left-0" : "right-0"}
    `}
  >
    {["❤️", "😂", "👍", "😢"].map((emoji) => (
      <span
        key={emoji}
        className="cursor-pointer text-lg relative hover:scale-150 transition-transform"
        onClick={() => handleReaction(msg._id, emoji)}
      >
        {emoji}
      </span>
    ))}
  </div>
)}

                        </div>
                      )}

                      <div
                        className={`max-w-[85%] md:max-w-[75%] px-4 py-2 text-sm rounded-2xl ${
                          isFromFriend
                            ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none shadow"
                            : "bg-blue-500 text-white rounded-tr-none shadow"
                        }`}
                      >
                        {msg.text}
                        <small
                          className={`block text-xs mt-1 ${
                            isFromFriend
                              ? "text-gray-500 dark:text-gray-400"
                              : "text-blue-100"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>

                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {[
                              ...new Set(msg.reactions.map((r) => r.emoji)),
                            ].map((emoji, i) => {
                              const sameEmojiReactions = msg.reactions.filter(
                                (r) => r.emoji === emoji
                              );
                              const isReactedByCurrentUser =
                                sameEmojiReactions.some(
                                  (r) => r.userId === currentUserId
                                );
                              // const count = sameEmojiReactions.length;

                              return (
                                <span
                                  key={i}
                                  className={`text-xs  w-5 h-5  rounded-full border flex items-center justify-center gap-1  ${
                                    isReactedByCurrentUser
                                      ? "bg-blue-500 text-white border-blue-600"
                                      : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border-gray-300"
                                  }`}
                                >
                                  {emoji} 
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
              className="flex-1 px-3 py-2 outline-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full text-white font-medium text-sm transition-colors"
            >
              Send <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </form>
        </footer>
      </div>
    </>
  );
}

{
  /* {messages.map((msg, index) => {
            const isFromFriend =
              (msg.sender && msg.sender === slectedFriends._id) ||
              (msg.from && msg.from === slectedFriends._id);
            return (
              <div
                key={index}
                className={`max-w-[70%] px-4 py-2 shadow-sm text-sm ${
                  isFromFriend
                    ? "bg-white self-start text-gray-800 rounded-tr-2xl rounded-br-2xl rounded-sm"
                    : "self-end text-right text-black client_1 rounded-tl-2xl rounded-bl-2xl rounded-sm"
                }`}
              >
                <div>
                  <div>
                    {(() => {
                      const date = new Date(msg.timestamp);
                      const day = date.toLocaleString("en-US", {
                        weekday: "short",
                      });
                      const dayNum = date.getDate();
                      const shortYear = date.getFullYear().toString().slice(-2);

                      return (
                        <>
                          <span>{day}</span>-<span>{dayNum}</span>-
                          <span>{shortYear}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <p>{msg.text}</p>
                <small className="block text-[0.65rem] text-gray-500 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </div>
            );
          })} */
}
