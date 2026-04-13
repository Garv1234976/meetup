import Sidebar_One from "../components/Sidebar_1";
import Sidebar_Two from "../components/Sidebar_2";
import { TypingProvider } from "../context/TypingContext";
import { SocketProvider } from "../context/SocketContext";
import { UserProvider } from "../context/Profile";

export default function MainApp() {
  return (
    <>
      {/* <SocketProvider> */}
        <TypingProvider>
          <UserProvider>
            <div className="flex">
              <Sidebar_One />
              <Sidebar_Two />
            </div>
          </UserProvider>
        </TypingProvider>
      {/* </SocketProvider> */}
    </>
  );
}
