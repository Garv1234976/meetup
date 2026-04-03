import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainApp from "./components/App";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Theme } from "./theme/globalTheme";
import { animate } from "animejs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContex";

/**
 *
 * @param {*} ClientId for authenticate from Oauth
 * @requires clientId
 * @returns **`props`** Client ID
 */
function App({ clientId }) {
  const [startAnim, setStartAnim] = useState(false);
  const [showMainApp, setShowMainApp] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleClick = () => {
    setStartAnim(true);
  };

  useEffect(() => {
    const animation = animate(".dots", {
      y: [
        { to: "-0.75rem", ease: "outExpo", duration: 600 },
        { to: 0, ease: "outBounce", duration: 800, delay: 100 },
      ],
      rotate: {
        from: "-1turn",
        delay: 0,
      },

      delay: (_, i) => i * 100,
      loopDelay: 800,
      loop: true,
      direction: "alternate",
    });

    return () => animation?.pause(); // cleanup on unmount
  }, []);

  return (
    <>
      <AnimatePresence>
        {!showMainApp && (
          <motion.div
            key="login-screen"
            className="bg-gradient-to-bl to-blue-500 from-green-500 relative flex justify-center items-center overflow-hidden h-screen w-full z-30 "
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute hidden max-sm:flex bg-[radial-gradient(at_55%_55%,white_0%,#90e0ef_65%)] justify-center items-center px-6 sm:px-10 py-2 sm:py-1 rounded-r-full shadow-md gap-3">
              <p className="text-slate-800 font-semibold text-base sm:text-lg whitespace-nowrap">
                Just a second
              </p>
              <div className="flex gap-2">
                <span className="dots w-2 h-2 sm:w-4 sm:h-4 bg-blue-300 rounded-full block"></span>
                <span className="dots w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-full block"></span>
                <span className="dots w-2 h-2 sm:w-4 sm:h-4 bg-blue-300 rounded-full block"></span>
              </div>
            </div>

            {/* ✅ Always Rendered — Only Animates on Click */}
            <motion.div
              className="max-sm:hidden big p-80 bg-gradient-to-r from-indigo-500 to-teal-400 absolute top-[-60px] right-4/5 rounded-full z-20"
              initial={{ scale: 1, x: 0 }}
              animate={startAnim ? { scale: 6, x: "600%" } : { scale: 1, x: 0 }}
              transition={{ duration: 1.5, ease: "circIn" }}
              onAnimationComplete={() => {
                if (startAnim) {
                  setTimeout(() => {
                    setShowMainApp(true);
                  }, 300);
                }
              }}
            />
            {/* Login Panel — Only shows if not animating */}
            {!startAnim && (
              <>
                <motion.div className=" max-sm:hidden p-40 bg-[radial-gradient(at_25%_25%,white_0%,#90e0ef_65%)] absolute right-0 rotate-[190deg] top-4/5 z-10" />
                <motion.div className=" max-sm:hidden p-52 bg-[radial-gradient(at_25%_25%,white_0%,#60a5fa_65%)] absolute right-2/12 rotate-[190deg] top-4/5 rounded-full z-10" />
                <motion.div className=" max-sm:hidden p-70 bg-[radial-gradient(at_25%_25%,white_0%,#00CAFF_65%)] absolute left-7/8 rotate-[130deg] top-2/6 rounded-full" />
                <motion.div
                  className="h-screen max-sm:p-6 p-19 w-full flex justify-center items-center"
                  style={{
                    borderRadius: "700px 0 0 0",
                    // backgroundColor: Theme.thirdBackgroundColor,
                  }}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="z-0 flex flex-col items-center bg-gray-100 rounded-4xl p-5 w-1/2 max-sm:w-full border-t-2 border-dashed"
                    style={{
                      boxShadow: `10px 10px ${Theme.primaryBackgroundColor}`,
                    }}
                  >
                    <p className="text-lg">Sign up / Sign in</p>

                    <div className="p-3">
                      <GoogleOAuthProvider clientId={clientId}>
                        <GoogleLogin
                          onSuccess={async (credentialResponse) => {
                            try {
                              const res = await fetch(
                                import.meta.env.VITE_BACK_DEV_API,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  credentials: "include",
                                  body: JSON.stringify({
                                    token: credentialResponse.credential,
                                  }),
                                }
                              );
                              const data = await res.json();
                              if (res.ok) {
                                setUser(data.user);
                                // console.log(" Token verified:", data);
                                setStartAnim(true); //  Start the animation -> show MainApp
                                setTimeout(() => {
                                  navigate("/chats");
                                }, 2000);
                              } else {
                                console.error(
                                  "❌ Token verification failed:",
                                  data.error
                                );
                              }
                            } catch (err) {
                              console.error(" Network or server error:", err);
                            }
                          }}
                          /**to prevent uncomment this line  Cross-Origin-Opener-Policy policy would block the window.postMessage call.*/
                          // useOneTap
                          ux_mode="popup"
                        />
                      </GoogleOAuthProvider>
                    </div>
                    <span>or</span>
                    <form className=" flex flex-col items-center gap-2" >
                      <label htmlFor="username" className="text-lg">
                        <input
                          name="username"
                          type="email"
                          placeholder="eg. johndoe@gmail.com"
                          className="border rounded p-1"
                          autoComplete="username"
                        />
                      </label>
                      {/* <label htmlFor="password" className="text-lg">
                        <input
                          name="password"
                          type="password"
                          placeholder="xxxxxxxxxx"
                          className="border rounded p-1 text-center"
                          autoComplete="current-password"
                        />
                      </label> */}
                      <div
                        onClick={handleClick}
                        className="bg-blue-300 w-full p-1 rounded-md text-center text-white font-semibold cursor-pointer"
                      >
                        Login
                      </div>
                    </form>
                    {/* TODO: adding the signup page */}
                    {/* <span className="flex gap-1">
                      Not created an account?
                      <a
                        href="/sign-up"
                        className="text-blue-500 font-semibold"
                      >
                        Sign up
                      </a>
                    </span> */}
                  </motion.div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* ✅ MainApp appears AFTER .big animation completes */}
      <AnimatePresence>
        {showMainApp && (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full h-screen"
          >
            <MainApp />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
