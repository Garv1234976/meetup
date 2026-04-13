import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";

export function RoomJoin() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const { socket } = useSocket();

  const handleJoin = () => {
    if (!roomId.trim()) return alert("Enter room ID");
    navigate(`/video?roomid=${roomId}`);
  };

const handleCreate = () => {
  socket.emit("create-room", ({ roomId }) => {
    console.log("ROOM CREATED:", roomId);

    // ✅ JOIN ROOM IMMEDIATELY (same socket)
    socket.emit("join-call", { roomId }, () => {
      navigate(`/video?roomid=${roomId}`);
    });
  });
};

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">SFU Room</h1>

      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="border p-2 w-64"
      />

      <button
        onClick={handleJoin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Join as Audience
      </button>

      <button
        onClick={handleCreate}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Create SFU (Host)
      </button>
    </div>
  );
}