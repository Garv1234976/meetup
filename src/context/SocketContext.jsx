import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACK_DEV_API;

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, { withCredentials: true });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsReady(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isReady }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
