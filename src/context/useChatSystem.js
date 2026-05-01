import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContex";

const supabase = createClient(
  "https://ywehlxverbpaavdxoxcd.supabase.co",
  "sb_publishable_SGALij1Ival2DdhZ3xjmXA_khrEOMpp"
);

export function useChatSystem({ chatId, friendId, dispatch }) {
  const { socket, setChatMessages } = useSocket();
  const { user } = useAuth();

  const currentUserId = user?._id;

  // =========================
  // 🔥 CORE STATE
  // =========================
  const [message, setMessage] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [uploading, setUploading] = useState(null); // 🔥 NEW
const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [isPreviewingAudio, setIsPreviewingAudio] = useState(false);
const typingTimeoutRef = useRef(null);
  

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // =========================
  // 🔗 LINK PREVIEW
  // =========================
  const handleInputChange = (value) => {
  setMessage(value);

  const match = value.match(/(https?:\/\/[^\s]+)/);

  if (match && socket) {
    setShowPreview(true);
    setIsPreviewLoading(true);
    setPreviewData(null);

    socket.emit("get_link_preview", match[0]);
  } else {
    setShowPreview(false);
    setPreviewData(null);
    setIsPreviewLoading(false);
  }

  // 🔥 ADD THIS BACK
  if (socket && chatId) {
    socket.emit("typing", {
      chatId,
      senderId: currentUserId,
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", {
        chatId,
        senderId: currentUserId,
      });
    }, 400);
  }
};

  useEffect(() => {
    if (!socket) return;

    const handlePreview = (data) => {
      setPreviewData(data);
      setIsPreviewLoading(false);
    };

    socket.on("link_preview_result", handlePreview);
    return () => socket.off("link_preview_result", handlePreview);
  }, [socket]);

  // =========================
  // 📤 SEND TEXT
  // =========================
  const sendText = () => {
    if (!message.trim()) return;

    const msg = {
      _id: "temp-" + Date.now(),
      chatId,
      from: currentUserId,
      to: friendId,
      text: message,
      preview: previewData,
      timestamp: new Date().toISOString(),
    };

    socket.emit("send_message", msg);
    dispatch({ type: "chat/addMessage", payload: msg });

    setMessage("");
    setPreviewData(null);
  };

  // =========================
  // ☁️ FILE UPLOAD (WITH PROGRESS)
  // =========================
  const uploadFile = async (file, onProgress) => {
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 90) progress = 90;
      onProgress(Math.floor(progress));
    }, 200);

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("chat-files")
      .upload(fileName, file);

    clearInterval(interval);

    if (error) return null;

    onProgress(100);

    const { data } = supabase.storage
      .from("chat-files")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // =========================
  // 📎 SEND FILE (WITH UI)
  // =========================
  const sendFile = async (file) => {
    const tempId = Date.now();

    setUploading({
      id: tempId,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
    });

    const url = await uploadFile(file, (progress) => {
      setUploading((prev) => ({ ...prev, progress }));
    });

    if (!url) return;

    const msg = {
      chatId,
      from: currentUserId,
      to: friendId,
      file: url,
      fileType: file.type,
      fileSize: file.size,
      timestamp: new Date().toISOString(),
    };

    socket.emit("send_message", msg);
    dispatch({ type: "chat/addMessage", payload: msg });

    setUploading(null);
  };

  // =========================
  // 🎤 AUDIO SYSTEM
  // =========================
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: "audio/webm",
      });

      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      setIsPreviewingAudio(true);
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    const file = new File([audioBlob], "voice.webm");

    await sendFile(file);

    setAudioBlob(null);
    setAudioUrl(null);
    setShowAudioModal(false);
  };


  useEffect(() => {
  let interval;

  if (isRecording) {
    interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  } else {
    setRecordingTime(0);
  }

  return () => clearInterval(interval);
}, [isRecording]);

const formattedTime = `${Math.floor(recordingTime / 60)}:${String(recordingTime % 60).padStart(2, "0")}`;
const cancelRecording = () => {
  setIsRecording(false);
  setAudioBlob(null);
  setAudioUrl(null);
  chunksRef.current = [];
};


const deleteMessage = (msg) => {
  if (!socket) return;
console.log("🚀 emitting delete:", msg._id);
  socket.emit("delete_message", {
    messageId: msg._id,
    chatId: msg.chatId,
    channelId: msg.channelId || null,
    type: msg.isBroadcast
      ? "broadcast"
      : msg.channelId
      ? "channel"
      : "chat",
    deleteForAll: true,
  });

  // 🔥 UPDATE SOCKET STATE ALSO
  setChatMessages((prev) => ({
    ...prev,
    [msg.chatId]: (prev[msg.chatId] || []).map((m) =>
      m._id === msg._id
        ? { ...m, text: "🚫 This message was deleted", deleted: true }
        : m
    ),
  }));
};
  return {
    message,
    setMessage,
    handleInputChange,

    sendText,
    sendFile,

    uploading,

    startRecording,
    stopRecording,
    sendAudio,
    isRecording,

    audioUrl,
    showAudioModal,
    setShowAudioModal,

    previewData,
    showPreview,
    isPreviewLoading,
    cancelRecording,
    recordingTime: formattedTime,
    isPreviewingAudio,
    setIsPreviewingAudio,
    deleteMessage
  };
}