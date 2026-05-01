import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [], // last 2 days
  // TODO: Adding Load state that loads more data of the user
  lastMessagesByUserId: {},
  lastMessage: localStorage.getItem("byeMe") || "",
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const msg = action.payload;

      const existingIndex = state.messages.findIndex(
        (m) =>
          String(m._id) === String(msg._id) ||
          (m.text === msg.text && m.from === msg.from && m.to === msg.to),
      );

      if (existingIndex !== -1) {
        // 🔥 replace temp message with real one
        state.messages[existingIndex] = msg;
      } else {
        // normal add
        state.messages.push(msg);
      }
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setLastMessage: (state, action) => {
      state.lastMessage = action.payload;
      localStorage.setItem("byeMe", action.payload);
    },
    toggleReaction: (state, action) => {
      const { messageId, userId, emoji } = action.payload;

      const msg = state.messages.find(
        (m) => String(m._id) === String(messageId),
      );

      //   if (!msg) return;

      if (!msg) {
        // 🔥 message not yet loaded → skip safely
        console.log("⚠️ message not found yet, reaction delayed");
        return;
      }
      if (!msg.reactions) msg.reactions = [];

      const existing = msg.reactions.find(
        (r) => r.userId === userId && r.emoji === emoji,
      );

      if (existing) {
        msg.reactions = msg.reactions.filter(
          (r) => !(r.userId === userId && r.emoji === emoji),
        );
      } else {
        msg.reactions.push({ userId, emoji });
      }
    },
    deleteMessage: (state, action) => {
  const { messageId, chatId } = action.payload;

  const chatMsgs = state.messages;

  state.messages = chatMsgs.map((m) =>
    m._id === messageId
      ? { ...m, text: "🚫 This message was deleted", deleted: true }
      : m
  );
}
  },
});

export const {
  addMessage,
  setMessages,
  clearMessages,
  setLastMessage,
  toggleReaction,
  deleteMessage
} = chatSlice.actions;
export default chatSlice.reducer;
