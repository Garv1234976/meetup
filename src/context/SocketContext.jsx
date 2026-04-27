import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContex";
import { useRef } from "react";
import { saveNotification } from "../../utils/saveNotification";

const SOCKET_URL = import.meta.env.VITE_BACK_DEV_API;

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user, loading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [channelMessages, setChannelMessages] = useState({});
  const [channelPinned, setChannelPinned] = useState({});
  const [channelUnread, setChannelUnread] = useState({});
  const [channelOnline, setChannelOnline] = useState({});
  const [activeChannel, setActiveChannel] = useState(null);
  const notificationAudio = useRef(null);
  const activeChannelRef = useRef(null);
  const userRef = useRef(null);

  const [chatUnread, setChatUnread] = useState({});
  const [chatMessages, setChatMessages] = useState({});
  // const [chatUnread, setChatUnread] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const activeChatRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);




  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);
  useEffect(() => {
    if (loading || !user) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      query: {
        userId: user._id,
      },
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected");
      setIsReady(true);
    });

    setSocket(newSocket);

    // Channel creator sockets connection  Globally 

    /**
     * @description receive_channel_message 
     * @alias ChannelCreator He can send message to the All subscribes.
     */
    newSocket.on("receive_channel_message", (data) => {
      if (!data) return;

      const isSelf = String(data.senderId) === String(userRef.current?._id);

      const isActive = data.channelId === activeChannelRef.current;

      if (!isSelf && !isActive && notificationAudio.current) {
        notificationAudio.current.currentTime = 0;
        notificationAudio.current.play().catch(() => { });
      }

      setChannelMessages((prev) => {
        const prevMsgs = prev[data.channelId] || [];

        return {
          ...prev,
          [data.channelId]: [
            ...prevMsgs,
            {
              ...data.message,
              time: new Date(data.message.createdAt).toLocaleTimeString(),
            },
          ],
        };
      });

      setChannelUnread((prev) => {
        if (data.channelId === activeChannelRef.current) return prev;
        if (String(data.senderId) === String(user._id)) return prev;
        return {
          ...prev,
          [data.channelId]: (prev[data.channelId] || 0) + 1,
        };
      });
    });

    /**
     * @description channel_seen_update
     * @alias ChannelCreator&SubsScriber The *Channel Creator* itself is first seen the message to it will also count
     * and keep track of the all user that seen to the Message 
     */
    newSocket.on("channel_seen_update", ({ messageId, seenCount, channelId }) => {
      setChannelMessages((prev) => {
        const msgs = prev[channelId] || [];

        return {
          ...prev,
          [channelId]: msgs.map((msg) =>
            msg._id === messageId
              ? { ...msg, seenCount }
              : msg
          ),
        };
      });
    });

    /**
     * @description channel_reaction_update
     * @alias ChannelCreator&SubsScriber Reaction based on the per users
     */
    newSocket.on("channel_reaction_update", ({ messageId, reactions, channelId }) => {
      setChannelMessages((prev) => {
        const msgs = prev[channelId] || [];

        return {
          ...prev,
          [channelId]: msgs.map((msg) =>
            msg._id === messageId
              ? { ...msg, reactions }
              : msg
          ),
        };
      });
    });


    /**
     * @description channel_pinned_update
     * @alias ChannelCreator pinned message can be done by admin not the all users
     */
    newSocket.on("channel_pinned_update", ({ channelId, pinnedMessages }) => {
      setChannelPinned((prev) => ({
        ...prev,
        [channelId]: pinnedMessages,
      }));
    });


    newSocket.on("channel_online_update", ({ channelId, onlineCount }) => {
      setChannelOnline((prev) => ({
        ...prev,
        [channelId]: onlineCount,
      }));
    });

    newSocket.on("new_friend_added", ({ friendId, chatId }) => {
      console.log("🔥 New friend added:", friendId, chatId);

      // 🔥 notify whole app
      window.dispatchEvent(
        new CustomEvent("new-friend-added", {
          detail: { friendId, chatId },
        })
      );
    });

    newSocket.on("auto_delete_updated", ({ channelId, enabled, duration }) => {
      // broadcast globally (like you did for new friend)
      window.dispatchEvent(
        new CustomEvent("auto-delete-updated", {
          detail: { channelId, enabled, duration },
        })
      );
    });


   newSocket.on("receive_message", (msg) => {
  const currentChatId = activeChatRef.current;

  const isActive = String(currentChatId) === String(msg.chatId);
  const isSelf = String(msg.from) === String(userRef.current?._id);

  // 🔥 UNREAD COUNT
  if (!isActive && !isSelf) {
    setChatUnread((prev) => ({
      ...prev,
      [msg.chatId]: (prev[msg.chatId] || 0) + 1,
    }));
  }

  // 🔥 OPTIONAL: store message globally
  setChatMessages((prev) => {
    const prevMsgs = prev[msg.chatId] || [];
    return {
      ...prev,
      [msg.chatId]: [...prevMsgs, msg],
    };
  });

});

newSocket.on("friend_request_accepted", async (data) => {
  console.log("🔥 ACCEPT EVENT:", data);

  // 🔥 save in IndexedDB
  await saveNotification({
    ...data,
    uniqueId: `accept_${data.user._id}`, // prevent duplicate
    isRead: false,
  });

  // 🔥 trigger UI
  window.dispatchEvent(
    new CustomEvent("friend-accepted", {
      detail: data,
    })
  );

  const { user, type, chatId } = data;
  if (type === "accepted_by_other") {
    // 🔥 create sidebar-ready object
    const newFriend = {
      ...user,
      isChannel: false,
      lastMessageAt: new Date().toISOString(),
      chatId,
    };

    // 🔥 dispatch to Sidebar2
    window.dispatchEvent(
      new CustomEvent("friend-added", {
        detail: newFriend,
      })
    );
  }
});

newSocket.on("friend_request_declined", async (data) => {
  const myId = userRef.current?._id;

  // 🔥 ONLY SAVE IF EVENT IS FOR ME
  if (data?.user?._id === myId) return;

  await saveNotification(data);

  window.dispatchEvent(
    new CustomEvent("friend-declined", {
      detail: data,
    })
  );
});


newSocket.on("new_message_notification", ({ chatId, from }) => {
  const activeChatId = activeChatRef.current;

  // ❌ user is inside same chat → ignore
  if (String(activeChatId) === String(chatId)) return;

  // 🔥 increase unread
  setChatUnread((prev) => ({
    ...prev,
    [chatId]: (prev[chatId] || 0) + 1,
  }));
});

newSocket.on("new_friend_request", async (data) => {
  console.log("📩 GLOBAL REQUEST:", data);

  // 🔴 optional: save notification
  await saveNotification({
    ...data,
    uniqueId: `request_${data.user._id}`,
    isRead: false,
  });

  // 🔥 GLOBAL EVENT (IMPORTANT)
  window.dispatchEvent(
    new CustomEvent("friend-request-received", {
      detail: data,
    })
  );
});

    return () => {
      newSocket.off("new_friend_added");
      newSocket.disconnect();
    };

  }, [user, loading]);


  useEffect(() => {
    const unlockAudio = () => {
      if (!notificationAudio.current) return;

      notificationAudio.current
        .play()
        .then(() => {
          notificationAudio.current.pause();
          notificationAudio.current.currentTime = 0;
          console.log("🔓 Audio unlocked");
        })
        .catch(() => { });

      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
  }, []);


  useEffect(() => {
    const audio = new Audio("/notification.mp3");
    audio.preload = "auto";
    audio.volume = 0.7;

    notificationAudio.current = audio;
  }, []);


  return (
    <SocketContext.Provider value={{ socket, isReady, channelMessages, channelPinned, channelUnread, setActiveChannel, setChannelUnread, channelOnline, setChannelMessages, setChannelPinned,setActiveChat, setChatUnread }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
