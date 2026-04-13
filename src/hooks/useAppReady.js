import { useAuth } from "../context/AuthContex";
import { useSocket } from "../context/SocketContext";

export const useAppReady = () => {
  const { user, loading: authLoading } = useAuth();
  const { isReady: socketReady } = useSocket();

  return {
    ready: !authLoading && (user ? socketReady : true),
  };
};