import Sidebar_One from "../components/Sidebar_1";
import Sidebar_Two from "../components/Sidebar_2";
import { TypingProvider } from "../context/TypingContext";
import { SocketProvider } from "../context/SocketContext";
import { UserProvider } from "../context/Profile";
import { useState } from "react";

export default function MainApp() {
   const [openInvite, setOpenInvite] = useState(false);
    const [resetKey, setResetKey] = useState(0);

  const handleResetApp = () => {
    setOpenInvite(false);
    setResetKey((prev) => prev + 1); 
  };
  return (
    <>
      {/* <SocketProvider> */}
        <TypingProvider>
          <UserProvider>
            <div className="flex w-full h-screen overflow-hidden">
              <Sidebar_One
              openInvite={openInvite} 
              setOpenInvite={setOpenInvite}
              onReset={handleResetApp}
              />
              <Sidebar_Two setOpenInvite={setOpenInvite} resetKey={resetKey}/>
            </div>
          </UserProvider>
        </TypingProvider>
      {/* </SocketProvider> */}
    </>
  );
}
