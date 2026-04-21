import { useCallback, useContext, useEffect, useState } from "react";
import { Theme } from "../../../theme/globalTheme";
import Logo from "/logo.svg";
import { Messaging } from "../../Message/Components/Message";
import { useTyping } from "../../../context/TypingContext";
import useOnline from "../../../utils/CheckOnline";
import { UserContext } from "../../../context/Profile";
import UserProfile from "../../Profile/PersonalInfo";
import { useSelector } from "react-redux";
import { ContentState } from "draft-js";
import { convertFromHTML, convertToRaw } from "draft-js";
import { motion, AnimatePresence } from "framer-motion";
import draftToHtml from "draftjs-to-html";
import { Editor } from "react-draft-wysiwyg";
import { EditorState } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { useSocket } from "../../../context/SocketContext";
import { useLocation, useNavigate } from "react-router-dom";
import { ChannelMessage } from "../../ChannelMessage/ChaneelMessage";
import { useAuth } from "../../../context/AuthContex";
import MeetUplogo from '/m.svg'
import BroadcastChannelCreator from "../../Broadcast/BroadcastChannelCreator";
// import Logo from '/logo.svg'
const templates = {
  1: `
    <p>👋 <b>Hello Everyone</b>,</p>
    <p>We hope you're doing great! 😊</p>
    <p>
      📢 We’ve got something exciting for you!
      Stay connected with us for updates, offers, and surprises 🎁
    </p>
    <p>💬 Feel free to reply anytime — we’re here to help!</p>
    <p>🙏 Thank you for being part of our journey.</p>
  `,

  2: `
    <p>🚀 <b>Big Update Alert!</b></p>
    <p>
      We’ve just launched <b>new features</b> to improve your experience 🎉
    </p>
    <ul>
      <li>⚡ Faster performance</li>
      <li>🎨 Improved UI</li>
      <li>🔒 Better security</li>
    </ul>
    <p>👉 Try it now and let us know your feedback!</p>
    <p>❤️ We appreciate your support.</p>
  `,

  3: `
    <p>💰 <b>Special Offer Just for You!</b></p>
    <p>
      🎉 Get <b>50% OFF</b> on your next purchase!
    </p>
    <p>⏳ Hurry! Limited time offer.</p>
    <p>
      👉 Use code: <b>SAVE50</b>
    </p>
    <p>🛒 Don’t miss out — grab the deal now!</p>
  `,

  4: `
    <p>🙏 <b>Thank You {{name}}!</b></p>
    <p>
      We truly appreciate your support ❤️
    </p>
    <p>
      ⭐ If you’re enjoying our service, we’d love your feedback!
    </p>
    <p>
      💬 Your opinion helps us grow and improve.
    </p>
    <p>🙌 Thanks for being with us!</p>
  `,

  5: `
    <p>🔔 <b>Reminder!</b></p>
    <p>
      You have a pending action waiting ⏳
    </p>
    <p>
      👉 Please complete it to continue using all features.
    </p>
    <p>⚡ It only takes a few seconds!</p>
    <p>💡 Need help? We’re here for you.</p>
  `,

  6: `
    <p>🎯 <b>Daily Tip</b></p>
    <p>
      Did you know? 🤔
    </p>
    <p>
      Using our platform regularly can boost your productivity by <b>2x 🚀</b>
    </p>
    <p>
      💡 Stay consistent and achieve more!
    </p>
    <p>🔥 Keep going, you’re doing great!</p>
  `,
};

export function Sidebar_Two({ token, setOpenInvite, resetKey,setIsChatOpen  }) {
  const off = useOnline();
  const { user } = useAuth()
  const { socket, channelUnread } = useSocket();
  const { typingUsers } = useTyping();
  const [active, setActive] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friends, setFriends] = useState([]);
  const { isProfile, setIsProfile } = useContext(UserContext);
  const lastMessages = useSelector((state) => state.chat.lastMessagesByUserId);
  const lstMsgByMe = useSelector((state) => state.chat.lastMessage);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [tempalate, SetTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [pickedFriend, setPickedFriend] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendingUsers, setSendingUsers] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [broadcastError, setBroadcastError] = useState(false);
  const [createChannleModal, setCreateChannleModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [friendsOnly, setFriendsOnly] = useState([]);
  const [noFriendModal, setNoFriendModal] = useState(false);
  const navigate = useNavigate()
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const channelIdFromUrl = params.get("Id");


  useEffect(() => {
    if (!channelIdFromUrl || friends.length === 0) return;

    const found = friends.find(
      (f) => String(f._id) === String(channelIdFromUrl)
    );

    if (!found) return;

    if (found.isChannel) {
      setSelectedChannel(found);
      setSelectedFriend(null);
    } else {
      setSelectedFriend(found);
      setSelectedChannel(null);
    }

    setIsChatOpen(true);
  }, [channelIdFromUrl, friends]);
  const handleEscKey = useCallback(
    (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    },
    [modalIsOpen],
  );

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  function openTemplate() {
    SetTemplate(true);
  }

  function closeTemplate() {
    SetTemplate(false);
  }


  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACK_DEV_API}/chats`, {
      method: "GET",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const friends = data?.friends || [];
        const myChannel = data?.myChannel || [];
        const joinChannel = data?.joinChannel || [];

        setFriendsOnly(friends);
        // channel merge
        const allChannel = [...myChannel, ...joinChannel].map((c) => ({
          ...c,
          isChannel: true
        }));

        // allfriends
        const allfriends = friends.map((f) => ({
          ...f,
          isChannel: false,
        }))

        // merged both

        const mergedChannelAndAllfriends = [...allfriends, ...allChannel];

        // sorting
        mergedChannelAndAllfriends.sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
          return bTime - aTime;
        });
        if (mergedChannelAndAllfriends) {
          setFriends(mergedChannelAndAllfriends);
        } else {
          setFriends([]);
        }
      })
      .catch((err) => {
        console.log("Failed to fetch Friends", err);
      });
  }, [token]);

  function handleFriendSelect(friend) {
    setSelectedFriend(friend);
  }

  useEffect(() => {
    const handleNewFriend = (e) => {
      const newFriend = e.detail;

      if (!newFriend || !newFriend._id) return;

      setFriends((prev) => {
        const safePrev = prev.filter((f) => f && f._id);

        if (safePrev.some((f) => f._id === newFriend._id)) {
          return safePrev;
        }

        return [...safePrev, newFriend];
      });
    };

    window.addEventListener("friend-added", handleNewFriend);

    return () => {
      window.removeEventListener("friend-added", handleNewFriend);
    };
  }, [friends]);

  const handleFriendClick = async (friend) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACK_DEV_API}/chats`, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      const friends = data?.friends || [];
      const myChannel = data?.myChannel || [];
      const joinChannel = data?.joinChannel || [];

      // 🔥 merge again (SAME LOGIC AS useEffect)
      const allChannel = [...myChannel, ...joinChannel].map((c) => ({
        ...c,
        isChannel: true,
      }));



      const allFriends = friends.map((f) => ({
        ...f,
        isChannel: false,
      }));

      const merged = [...allFriends, ...allChannel];
      merged.sort((a, b) => {
        const aTime = a.lastMessageAt
          ? new Date(a.lastMessageAt)
          : new Date(0);
        const bTime = b.lastMessageAt
          ? new Date(b.lastMessageAt)
          : new Date(0);
        return bTime - aTime;
      });

      setFriends(merged);



      // 🔥 IMPORTANT: find updated friend
      const updatedFriend = merged.find(
        (f) => !f.isChannel && String(f._id) === String(friend._id)
      );

      if (updatedFriend) {
        setSelectedFriend(updatedFriend);
        setSelectedChannel(null);
        setIsChatOpen(true);
        navigate(`/chats?Id=${updatedFriend._id}`, { replace: true });
      }

    } catch (err) {
      console.error("Failed to refresh chats", err);
    }
  };

  const handleChannelClick = (channel) => {
    setSelectedChannel(channel);
    setSelectedFriend(null);
    setIsChatOpen(true);
    navigate(`/chats?Id=${channel._id}`, { replace: true });
  };


  useEffect(() => {
    setSelectedFriend(null);
    setSelectedChannel(null);
    setIsOpen(false);
    setCreateChannleModal(false);
  }, [resetKey]);

  const pickedFriends = friends.filter((f) =>
    selectedUsers.includes(String(f._id)),
  );

  const MAX_VISIBLE = 20;

  const visibleFriends = pickedFriends.slice(0, MAX_VISIBLE);
  const extraCount = pickedFriends.length - MAX_VISIBLE;

  const filteredFriends = friendsOnly.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // console.log(JSON.stringify(filteredFriends))
  const getEditorHtml = () => {
    const content = editorState.getCurrentContent();
    return draftToHtml(convertToRaw(content));
  };


  if (isProfile) {
    return (
      <>
        <div className="w-full p-4 flex flex-col gap-4 " style={{ background: Theme.primaryBackgroundColor }}>
          <div>
            <button
              onClick={() => setIsProfile(false)}
              className=""
            >
              <li className="fa-solid fa-xmark bg-red-500 px-4 py-2 rounded text-white cursor-pointer text-lg mb-4"></li>
            </button>
            <UserProfile />
          </div>
        </div>
      </>
    );
  }

  const filteredChatList = friends.filter((f) => {
    const text = searchTerm.toLowerCase();

    return (
      f.name?.toLowerCase().includes(text) ||
      f.email?.toLowerCase().includes(text)
    );
  });
  return (
    <>
      <div
        className={`${selectedFriend || selectedChannel
            ? "hidden md:block"
            : "block"
          } w-full md:w-[33%]`}
        style={{ backgroundColor: Theme.secondaryBackgroundColor }}
      >
        <div className="flex justify-between px-5">
          {/* <div className="flex gap-4">
            <p className="font-semibold">Chats</p>
            <p className="font-semibold">Streams</p>
          </div> */}
          {!off && <h1>Offline</h1>}
          <div>
            {/* <i className="fa-solid fa-tower-broadcast"></i> */}
          </div>

          
          
        </div>
          <div className="md:hidden flex items-center justify-between px-3 py-2">
            <div className="">
            <img className="w-30" src={Logo} alt="" />
          </div>
          <div onClick={() => navigate('/broadcast')}>
            <button className="font-semibold text-sm bg-blue-400 cursor-pointer px-3 py-1 rounded-xl text-white">Create Broadcast</button>
          </div>
          </div>
        <div className="flex justify-center px-4  items-center gap-1">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-1 my-4 rounded"
            type="search"
            placeholder="Search Chats or Starts a new Chats"
            style={{ backgroundColor: Theme.searchInout }}
          />
          <div
            className=" p-1 rounded"
            style={{ backgroundColor: Theme.searchInout }}
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
        </div>
        <div className="flex gap-5 px-4 mb-2 mt-1 items-center">
          <span style={{ backgroundColor: Theme.primaryBackgroundColor }} className="px-4 rounded-2xl text-sm font-semibold  border border-blue-500 cursor-pointer">All</span>
          <span style={{ backgroundColor: Theme.primaryBackgroundColor }} className="px-4 rounded-2xl text-sm font-semibold  border border-blue-500 cursor-pointer">Group</span>
        </div>
        <div
          className="overflow-y-auto scrollbar scrollbar-thin scrollbar-track-sky-200  scrollbar-thumb-blue-400 max-h-[calc(100vh-130px)] px-2"
          style={{ scrollbarGutter: "stable" }}
        >
          {/* <AnimatePresence> */}
            {filteredChatList.length === 0 ? (
              <div className="flex items-center justify-center py-3 ">
                <div onClick={() => setOpenInvite(true)} className="bg-blue-500 flex items-end gap-5 px-3 py-1 rounded-md mt-50 cursor-pointer">
                  <i className="fa-solid fa-person-circle-plus text-xl text-white"></i>
                  <span className="flex text-white text-sm font-semibold">Add Friend</span>
                </div>
              </div>
            ) : ''}
            {filteredChatList.map((friend, i) => (
              <motion.div
              key={i}
                layout
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  backgroundColor:
                    selectedFriend?._id === friend._id ||
                      selectedChannel?._id === friend._id
                      ? "#e5e7eb"
                      : Theme.onchat.active,
                }}
                whileHover={{ backgroundColor: "#e5e7eb", scale: 1.02 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
                onClick={() => {
                  if (friend.isChannel) {
                    handleChannelClick(friend);
                  } else {
                    handleFriendClick(friend);
                  }
                }}
                className="px-5 py-2 flex items-start justify-between mb-1 rounded-sm cursor-pointer"
              >
                <div className="flex gap-2 ">
                  {friend.isBroadcast === true ? (
                    <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-tower-cell text-xl text-white"></i>
                    </div>
                  ) : (
                    <img
                      className="w-10 h-10 rounded-full mix-blend-multiply object-contain"
                      src={friend.picture || MeetUplogo}
                      alt={`profile picture of ${friend.name}`}
                    />
                  )}
                  <div className="flex flex-col">
                    <span>{friend.name}</span>
                    {/* {console.log(friend)} */}
                    {/* {friend._id && typingUsers[friend._id] ? <p>typing ..</p> : lastMessages[friend._id]?.text.length > 14 ? <span>{lastMessages[friend._id]?.text.slice(0, 14)}...</span> : <span>{lastMessages[friend._id]?.text}</span> || lstMsgByMe
                
                } */}
                    {friend._id && typingUsers[friend._id] && (
                      <p>typing ..</p>
                    )}
                    {/* {friend._id && typingUsers[friend._id] ? (
                      <p>typing ..</p>
                    ) : lastMessages[friend._id]?.text ? (
                      <span>
                        {lastMessages[friend._id].text.length > 14
                          ? `${lastMessages[friend._id].text.slice(0, 14)}...`
                          : lastMessages[friend._id].text}
                      </span>
                    ) : lstMsgByMe ? (
                      <span>
                        {lstMsgByMe.length > 14
                          ? `${lstMsgByMe.slice(0, 14)}...`
                          : lstMsgByMe}
                      </span>
                    ) : (
                      <span>No messages yet</span>
                    )} */}
                  </div>

                </div>
                <div className="flex items-center flex-col">
                  <span>
                    {friend.lastMessageAt
                      ? new Date(friend.lastMessageAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : ""}
                  </span>
                  <span >
                    {friend.isChannel &&
                      String(friend.creator) !== String(user._id) && //  hide for creator
                      channelUnread[friend._id] > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 font-semibold rounded-full ">
                          {channelUnread[friend._id] > 99 ? "99+" : channelUnread[friend._id]}
                        </span>
                      )}
                  </span>
                </div>
              </motion.div>
            ))}
          {/* </AnimatePresence> */}
        </div>
      </div>

      <div
        className={`${selectedFriend || selectedChannel
            ? "block w-full md:w-[65%]"
            : "hidden md:flex w-[65%]"
          }`}
      >
        {selectedChannel ? (
          <ChannelMessage channelid={selectedChannel._id} fullchannelobject={selectedChannel} onBack={() => { setSelectedChannel(null); setSelectedFriend(null);setIsChatOpen(false); }} />
        ) : selectedFriend ? (
          <Messaging
            slectedFriends={selectedFriend}
            onBack={() => { setSelectedFriend(null); setSelectedChannel(null);setIsChatOpen(false); }}
          />
        ) : (
          <div
            className="hidden md:flex w-[100%] p-1.5  py-5  justify-center items-center  flex-col"
            style={{ backgroundColor: Theme.primaryBackgroundColor }}
          >
            <div className="flex justify-center">
              <div className="w-full">
                <img className="pic w-full" src={Logo} alt="meetup logo" />
                <p
                  className="text-2xl text-center text- font-semibold "
                  style={{ color: Theme.primaryTextColor }}
                >
                  "Type, Send, Smile – No Fuss Messaging."
                </p>
              </div>
            </div>
            <div className="flex justify-center pt-10">
              <div className="flex gap-10">
                <button
                  className="relative glow-wrapper px-5 py-2 rounded-md font-bold outline-none cursor-pointer"
                  // onClick={openModal}
                  onClick={() => {
                    if (friendsOnly.length === 0) {
                    setNoFriendModal(true);
                  } else {
                    navigate("/broadcast");
                  }
                  }}
                >
                  <span className="relative">BroadCast</span>
                </button>

                <button onClick={() => {
                  if (friendsOnly.length === 0) {
                    setNoFriendModal(true);
                  } else {
                    navigate("/channel");
                  }
                }}
                  className="rounded-md font-bold border border-blue-400 hover:text-white hover:bg-blue-600 px-4 py-1 flex gap-2 items-center cursor-pointer">
                  <span><i className="fa-solid fa-bullhorn"></i> </span>Create Channel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>

        {/* Broadcast Modal */}
        {modalIsOpen && (
          <motion.div
            key="modal-overlay"
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-[90%] h-[93%] rounded-xl relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* CLOSE BUTTON */}
              <span
                onClick={closeModal}
                className="absolute top-3 right-3 rounded-md font-bold cursor-pointer"
              >
                <i className="fa-solid fa-xmark bg-red-500 px-4 py-1 rounded text-white cursor-pointer" title="close"></i>

              </span>

              <div className="p-4 h-full overflow-hidden">
                {/* <AnimatePresence> */}
                {modalIsOpen && (
                  <div>
                    <div>
                      <div className="rounded-md flex justify-end  w-full">
                        <div className="w-[65%]  flex justify-between">
                          <span className="text-3xl font-semibold">
                            Write Message to BroadCast
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex w-full  justify-between p-2 rounded-md my-2 h-[75vh] gap-5"
                        style={{
                          backgroundColor: Theme.primaryBackgroundColor,
                        }}
                      >
                        <div className="w-[30%]">
                          <p className="text-center font-semibold">
                            Select to BroadCast
                          </p>
                          <div className="py-2 flex items-center gap-5">
                            <input
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              type="search"
                              className="w-75 border border-blue-400 rounded-md p-1"
                              name=""
                              id=""
                              placeholder="Search for Friends"
                            />
                            <button
                              onClick={() => {
                                if (selectedUsers.length === friends.length) {
                                  // Unselect all
                                  setSelectedUsers([]);
                                } else {
                                  // Select all
                                  setSelectedUsers(
                                    filteredFriends.map((f) => String(f._id)),
                                  );
                                }
                              }}
                              className="rounded-md border text-blue-500 hover:text-blue-800 bg-blue-200 p-[7.2px] py-2 font-semibold cursor-pointer text-[12px]"
                            >
                              {selectedUsers.length === friends.length
                                ? "Unselect All"
                                : "Select All"}
                            </button>
                          </div>
                          <div className="py-3">
                            {filteredFriends.length === 0 && (
                              <p className="text-center text-gray-500 mt-4">
                                No friends found 😔
                              </p>
                            )}
                            {filteredFriends.map((d, i) => (
                              <div
                                key={d?._id || i}
                                className="flex gap-5 px-3 items-center bg-blue-100 w-100 rounded-md mb-1 p-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(
                                    String(d._id),
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsers((prev) => [
                                        ...prev,
                                        String(d._id),
                                      ]);
                                    } else {
                                      setSelectedUsers((prev) =>
                                        prev.filter((id) => id !== d._id),
                                      );
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                                <img
                                  src={d.picture}
                                  className="w-10 h-10 rounded-full"
                                  alt=""
                                />
                                <div className="flex flex-col">
                                  <span className="text-lg">
                                    {d.name
                                      .split(
                                        new RegExp(`(${searchTerm})`, "gi"),
                                      )
                                      .map((part, i) =>
                                        part.toLowerCase() ===
                                          searchTerm.toLowerCase() ? (
                                          <span
                                            key={i}
                                            className="bg-yellow-200"
                                          >
                                            {part}
                                          </span>
                                        ) : (
                                          part
                                        ),
                                      )}
                                  </span>
                                  <span className="font-semibold text-xs">
                                    {d.email}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-[70%] bg-white rounded-2xl ">
                          <div className="flex justify-center gap-10 py-2 items-center">
                            <p>Write Message</p>
                            <button
                              onClick={openTemplate}
                              className="rounded-md font-bold border border-blue-400 hover:text-white hover:bg-blue-600 px-4 py-1 cursor-pointer"
                            >
                              Use Template
                            </button>
                          </div>
                          <Editor
                            editorState={editorState}
                            toolbarClassName="toolbarClassName"
                            wrapperClassName="wrapperClassName"
                            editorClassName="editorClassName"
                            onEditorStateChange={setEditorState}
                          />
                        </div>
                      </div>

                      <div className="absolute right-5 bottom-4 z-50">
                        <div className="flex gap-10">
                          <button
                            className="relative glow-wrapper px-5 py-2 rounded-md font-bold outline-none cursor-pointer"
                            onClick={() => {
                              if (!socket) return;

                              const content = editorState.getCurrentContent();
                              // const text = content.getPlainText();
                              const html = draftToHtml(
                                convertToRaw(editorState.getCurrentContent()),
                              );
                              if (!content.hasText()) return;

                              // const recipients = selectedUsers.length
                              //   ? selectedUsers
                              //   : filteredFriends.map((f) => f._id);

                              if (!selectedUsers.length) {
                                setBroadcastError(true);

                                setTimeout(() => {
                                  setBroadcastError(false);
                                }, 2000);

                                return;
                              }

                              const recipients = selectedUsers.map(String);

                              //  SAVE USERS BEFORE CLEARING
                              setSendingUsers(
                                friends.filter((f) =>
                                  recipients.includes(String(f._id)),
                                ),
                              );

                              //  SHOW SENDING UI
                              setIsSending(true);

                              socket.emit("send_broadcast", {
                                recipients,
                                text: html,
                              });

                              //  CLEAR BACKGROUND STATE
                              setSelectedUsers([]);
                              setSearchTerm("");
                              setSelectedTemplate(null);
                              SetTemplate(false);
                              setEditorState(EditorState.createEmpty());

                              closeModal();

                              setTimeout(() => {
                                setIsSending(false);
                                setSendingUsers([]); // cleanup
                              }, 2000);
                            }}
                          // disabled={!friends.length}
                          >
                            <span className="relative">BroadCast</span>
                          </button>

                          <button
                            onClick={() => setIsPreviewOpen(true)}
                            className="rounded-md font-bold border border-blue-400 hover:text-white hover:bg-blue-600 px-4 py-1"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-2 flex flex-col items-start w-200 overflow-auto"
                      style={{ scrollbarWidth: "none" }}
                    >
                      <div className="flex items-center group">
                        <div className="flex items-center">
                          <AnimatePresence>
                            {visibleFriends.map((user, i) => (
                              <motion.div
                                key={user._id || i}
                                layout
                                className="-ml-3 first:ml-0"
                                initial={{ scale: 0, opacity: 0, x: -10 }}
                                animate={{ scale: 1, opacity: 1, x: 0 }}
                                exit={{ scale: 0, opacity: 0, x: -10 }}
                                transition={{
                                  duration: 0.25,
                                  delay: i * 0.05,
                                }}
                              >
                                <img
                                  src={user.picture}
                                  className="size-8 rounded-full ring-1 ring-gray-900"
                                />
                              </motion.div>
                            ))}

                            {/* +COUNT BUBBLE */}
                            {extraCount > 0 && (
                              <motion.div
                                key="extra"
                                layout
                                className="-ml-3 flex items-center justify-center size-8 rounded-full bg-gray-800 text-white text-xs font-bold ring-2 ring-gray-900"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                +{extraCount}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* </AnimatePresence> */}
              </div>
            </motion.div>
          </motion.div>
        )}

        {tempalate && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex justify-center items-start pt-20 z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-[50%] h-[43%] rounded-xl relative origin-top"
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-end py-2 gap-52 px-2 items-start">


                <div className="flex justify-center  ">
                  <span className="rounded-md font-bold border border-blue-400 hover:text-white hover:bg-blue-600 px-4 py-1 cursor-pointer">
                    Select Template here !
                  </span>
                </div>

                <div
                  onClick={closeTemplate}
                  className=" rounded-md font-bold cursor-pointer"
                >
                  <i className="fa-solid fa-xmark bg-red-500 px-4 py-1 rounded text-white cursor-pointer" title="close"></i>
                </div>

              </div>
              <div className="p-3">

                <div
                  className="grid grid-cols-4 gap-40 overflow-auto"
                  style={{ scrollbarWidth: "none" }}
                >
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="w-52 h-44 bg-white border rounded-xl p-3 flex flex-col justify-between shadow hover:shadow-lg transition"
                    >
                      {/* TEMPLATE PREVIEW */}
                      <div
                        className="text-sm line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: templates[item] }}
                      />

                      {/* ACTION BUTTONS */}
                      <div className="flex justify-between gap-2 mt-2">
                        {/* PREVIEW BUTTON */}
                        <button
                          onClick={() => {
                            setSelectedTemplate(item);
                            // closeModal();
                          }}
                          className="flex-1 text-xs border border-gray-400 rounded-md py-1 hover:bg-gray-200"
                        >
                          Preview
                        </button>

                        {/* SELECT BUTTON */}
                        <button
                          onClick={() => {
                            const html = templates[item];

                            const blocksFromHTML = convertFromHTML(html);
                            const content = ContentState.createFromBlockArray(
                              blocksFromHTML.contentBlocks,
                              blocksFromHTML.entityMap,
                            );

                            setEditorState(
                              EditorState.createWithContent(content),
                            );
                            SetTemplate(false); // close template modal
                          }}
                          className="flex-1 text-xs bg-blue-500 text-white rounded-md py-1 hover:bg-blue-600"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}

        {/* <AnimatePresence> */}
        {selectedTemplate && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-[1100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-[40%] h-[50%] rounded-xl p-5 relative origin-center"
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="rounded-md font-bold"
                >
                  <i className="fa-solid fa-xmark bg-red-500 px-4 py-1 rounded text-white cursor-pointer" title="close"></i>

                </button>
              </div>

              <p className="text-lg font-semibold">
                Template {selectedTemplate}
              </p>
              <div
                className="border p-3 rounded-md"
                dangerouslySetInnerHTML={{
                  __html: templates[selectedTemplate],
                }}
              />
            </motion.div>
          </motion.div>
        )}
        {/* </AnimatePresence> */}
        {/* </AnimatePresence> */}
        {/* <AnimatePresence> */}
        {isSending && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-[1200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white px-6 py-6 rounded-2xl flex flex-col items-center gap-5 shadow-xl"
              initial={{ y: 100, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 100, scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* 🔥 Avatar Stack */}
              <div className="flex items-center">
                {/* <AnimatePresence> */}
                {sendingUsers.slice(0, 20).map((user, i) => (
                  <motion.div
                    key={user._id || i}
                    className="-ml-3 first:ml-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <img
                      src={user.picture}
                      className="size-10 rounded-full ring-2 ring-gray-900"
                    />
                  </motion.div>
                ))}

                {extraCount > 0 && (
                  <motion.div
                    className="-ml-3 size-10 flex items-center justify-center bg-gray-800 text-white rounded-full text-xs font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    +{extraCount}
                  </motion.div>
                )}
                {/* </AnimatePresence> */}
              </div>

              {/* 🔥 Loader */}
              <motion.div
                className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />

              <p className="text-sm font-semibold text-gray-600">
                Sending message...
              </p>
            </motion.div>
          </motion.div>
        )}
        {/* </AnimatePresence> */}

        {/* <AnimatePresence> */}
        {isPreviewOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-[50%] max-h-[70vh] rounded-xl p-5 flex flex-col gap-4"
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
            >
              {/* HEADER */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Preview Message</h2>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="bg-gray-400 px-3 py-1 rounded-md font-bold"
                >
                  Close
                </button>
              </div>

              {/* MESSAGE PREVIEW */}
              <div className="border p-4 rounded-md overflow-auto bg-gray-50 flex items-center justify-center min-h-[150px]">
                {editorState.getCurrentContent().hasText() ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: getEditorHtml() }}
                    className="w-full"
                  />
                ) : (
                  <div className="text-gray-500 text-center flex flex-col items-center gap-2">
                    <span className="text-3xl">🫤</span>
                    <p className="font-semibold">No Preview</p>
                    <span
                      className="text-sm font-semibold hover:underline cursor-pointer"
                      onClick={() => setIsPreviewOpen(false)}
                    >
                      Write something to preview your message
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        {broadcastError && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="fixed top-5 right-5 bg-yellow-500 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-[9999]"
          >
            <span className="text-lg">⚠️</span>
            <span className="text-sm font-medium">
              Select at least one user
            </span>
          </motion.div>
        )}




        {noFriendModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]"
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
              <div className="text-3xl mb-2">😕</div>

              <h2 className="text-lg font-semibold mb-2">
                No Friends Found
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                Please add friends first before creating a channel.
              </p>

              <div className="flex gap-3 justify-center">

                {/* Add Friend */}
                <button
                  onClick={() => {
                    setNoFriendModal(false);
                    setOpenInvite(true); // 🔥 opens your invite modal
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
                >
                  Add Friends
                </button>

                {/* Close */}
                <button
                  onClick={() => setNoFriendModal(false)}
                  className="bg-gray-300 px-3 py-1 rounded-md text-sm"
                >
                  Cancel
                </button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
