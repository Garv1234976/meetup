import Sidebar_One from "../components/Sidebar_1";
import Sidebar_Two from "../components/Sidebar_2";
import { TypingProvider } from "../context/TypingContext";
import { SocketProvider } from "../context/SocketContext";
import { UserProvider } from "../context/Profile";
import { useEffect, useState } from "react";

export default function MainApp() {
  const [openInvite, setOpenInvite] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const handleResetApp = () => {
    setOpenInvite(false);
    setResetKey((prev) => prev + 1); 
    setIsChatOpen(false);
  };
  useEffect(()=> {
    const redirectUrl = localStorage.getItem("redirectAfterLogin");
          if (redirectUrl) {
  localStorage.removeItem("redirectAfterLogin");

  // 🔥 optional delay for smooth UX
  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 0);
}
  },[])
  return (
    <>
      {/* <SocketProvider> */}
        <TypingProvider>
          <UserProvider>
            <div className="flex w-full">
              <Sidebar_One
              openInvite={openInvite} 
              setOpenInvite={setOpenInvite}
              isChatOpen={isChatOpen}
              onReset={handleResetApp}
              />
              <Sidebar_Two setOpenInvite={setOpenInvite} resetKey={resetKey} setIsChatOpen={setIsChatOpen}/>
            </div>
          </UserProvider>
        </TypingProvider>
      {/* </SocketProvider> */}
    </>
  );
}
