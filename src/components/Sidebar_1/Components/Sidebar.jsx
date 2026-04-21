import { useContext, useEffect, useRef, useState } from "react";
import { Theme } from "../../../theme/globalTheme";
import { data, Link, replace, useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/Profile";
import Modal from "react-modal";
import { motion, AnimatePresence } from "framer-motion";
import GroupChat from "../../Group";
import { QRCode } from "react-qrcode-logo";
import Logo from "/public/m.svg";
import { useAuth } from "../../../context/AuthContex";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";




const SkeletonCard = ({ i }) => (
  <motion.div
    key={i}
    initial={{ opacity: 0.4 }}
    animate={{ opacity: 1 }}
    transition={{
      repeat: Infinity,
      duration: 1,
      ease: "easeInOut",
      repeatType: "reverse",
    }}
    className="mb-3 flex justify-start"
  >
    <div className="max-w-[80%] w-full bg-[#1e293b] rounded-2xl p-3 relative overflow-hidden">
      {/* shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />

      {/* fake content */}
      <div className="h-4 bg-gray-500 rounded w-1/3 mb-2"></div>
      <div className="h-3 bg-gray-600 rounded w-full mb-1"></div>
      <div className="h-3 bg-gray-600 rounded w-5/6 mb-1"></div>
      <div className="h-3 bg-gray-600 rounded w-2/3"></div>
    </div>
  </motion.div>
);

export function Sidebar_One({ token, openInvite, setOpenInvite,onReset,isChatOpen   }) {
  const { user, setUser } = useAuth();
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);
  const { setIsProfile } = useContext(UserContext);
  const [alertVisible, setAlertVisible] = useState(false);
  const [copied, setCopied] = useState("");
  const [requests, setRequests] = useState([]);
  // const [forSender, setForSender] = useState([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [showGroupSection, setShowGroupSection] = useState(false);
  const [BroadCastModal, SetBroadCastModal] = useState(false);
  const [trackBraodCastData, setTrackBraodCastData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // const [invite, setInvite] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState(false);
  const [copyTick, setCopyTick] = useState(false);
  const [showTourPrompt, setShowTourPrompt] = useState(false);
    const navigate = useNavigate();

  const driverObj = driver({
  showProgress: true,
  steps: [
    {
      element: '#addFriend',
      popover: {
        title: 'Add Friends',
        description: 'Click here to invite your friends and start chatting together.',
      },
    },
    {
      element: '#inviteFriendModal',
      popover: {
        title: 'Invite Options',
        description: 'You can invite friends using a QR code, link, or invite ID.',
      },
    },
    {
      element: '#scanQrcodetoinvitefriend',
      popover: {
        title: 'Scan QR Code',
        description: 'Ask your friend to scan this QR code to connect instantly.',
      }
    },
    {
      element: '#yourinviteid',
      popover: {
        title: 'Your Invite ID',
        description: 'Share this unique ID with your friend so they can send you a request.',
      }
    },
    {
      element: '#actionbutton',
      popover: {
        title: 'Enter Invite Code',
        description: 'Paste your friend’s invite code here and click "Add" to connect.',
      }
    }
  ]
});
  
const startTour = () => {
  setShowTourPrompt(false);
  driverObj.drive();
  localStorage.setItem("isaddFriendTourComplete", "true");
};

const skipTour = () => {
  setShowTourPrompt(false);
  localStorage.setItem("isaddFriendTourComplete", "true");
};

useEffect(() => {
  const seen = localStorage.getItem("isaddFriendTourComplete");

  if (!seen) {
    setTimeout(() => {
      setShowTourPrompt(true);
    }, 800); // slight delay for better UX
  }
}, []);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  function openBoardCastModal() {
    SetBroadCastModal(true);
  }
  function closeBoardCastModal() {
    SetBroadCastModal(false);
  }

  function handleClick(str) {
    setActive(str);
  }

  function openInviteModal() {
    setOpenInvite(true);
  }

  function closeInviteModal() {
    setOpenInvite(false);
  }



  const tractBraodcastMessage = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/broadcasts`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setTrackBraodCastData(data.broadcasts || []);
    } catch (error) {
      console.log("Failed to fetch /broadcasts");
      setTrackBraodCastData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (senderId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${senderId}/accept`,
        {
          method: "POST",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error();

      const acceptedUser = requests.find((r) => r._id === senderId);

      //  1. close popup
      setOpen(false);

      //  2. instant UI update (OLD BEHAVIOR - KEEP THIS)
      if (acceptedUser) {
        window.dispatchEvent(
          new CustomEvent("friend-added", {
            detail: acceptedUser,
          })
        );
      }

      //  3. fetch fresh user (SOURCE OF TRUTH)
      const userRes = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
        { credentials: "include" }
      );

      const updated = await userRes.json();
      setUser(updated.user);

      //  4. 🔥 get FULL friend with chatId
      const fullFriend = updated.user.friends?.find(
        (f) => f._id === senderId
      );

      //  5. 🔥 FIX Messaging issue
      if (fullFriend) {
        setSelectedFriend({ ...fullFriend }); // IMPORTANT
      }

    } catch (err) {
      console.error("Accept failed", err);
    }
  };

  const handleDecline = async (senderId) => {
    try {
      setOpen(false); 

      await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${senderId}/decline`,
        {
          method: "POST",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const res = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
        { credentials: "include" }
      );

      const updated = await res.json();
      setUser(updated.user);

    } catch (err) {
      console.error("Decline failed");
    }
  };
  const handleAcceptAll = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/acceptall`,
        {
          method: "POST",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error();

      // ✅ 1. 🔥 INSTANT UI (LIKE SINGLE ACCEPT)
      requests.forEach((req) => {
        window.dispatchEvent(
          new CustomEvent("friend-added", {
            detail: req,
          })
        );
      });

      // ✅ 2. clear request UI
      setRequests([]);

      // ✅ 3. refresh real data
      const userRes = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
        { credentials: "include" }
      );

      const updated = await userRes.json();
      setUser(updated.user);

    } catch (err) {
      console.error("Accept all failed");
    }
  };


  const copyToClipboard = (link) => {
  navigator.clipboard
    .writeText(link)
    .then(() => {
      setCopied(link);
      setAlertVisible(true);

      // ✅ show check icon
      setCopyTick(true);

      // ⏳ revert after 2 sec
      setTimeout(() => {
        setCopyTick(false);
        setAlertVisible(false);
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
};

  const groupedBroadcasts = trackBraodCastData.reduce((acc, item) => {
    const date = new Date(item.createdAt);

    // format like: "Today", "Yesterday", or full date
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label;

    if (date.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString();
    }

    if (!acc[label]) acc[label] = [];
    acc[label].push(item);

    return acc;
  }, {});

  const sendInviteByCode = async () => {
    if (!inviteInput.trim()) return;

    try {
      setInviteLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${inviteInput}`,
        {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error();

      setInviteInput("");

      // ✅ SUCCESS ANIMATION
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 2000);

    } catch (err) {
      setInviteError(true);
      setTimeout(() => setInviteError(false), 2000);
    } finally {
      setInviteLoading(false);
    }
  };
  useEffect(() => {
    if (user?.friendRequestsReceived) {
      setRequests(user.friendRequestsReceived);
    } else {
      setRequests([]);
    }
  }, [user]);

  useEffect(() => {
    if (!open) return;

    fetch(`${import.meta.env.VITE_BACK_DEV_API}/api/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user); // 🔥 THIS IS KEY
      })
      .catch(() => { });
  }, [open]);

  // const requests = user?.friendRequestsReceived || [];

  return (
    <>
      <div
        className={`group 
    ${isChatOpen ? "hidden md:flex" : "flex"} 
    w-[15%] sm:w-[10%] md:w-[4%] hover:md:w-[6%] transition-all duration-75`}
        style={{ backgroundColor: Theme.thirdBackgroundColor }}
      >
        <div className="flex items-center justify-between h-screen flex-col py-5 ">
          <div className="flex flex-col gap-5  lg:text-xl text-sm ">
            <i className="fa-solid fa-bars cursor-pointer"></i>
            {/* {<i
              className="fa-solid fa-message cursor-pointer"
              title="Chats"
              onClick={() => setIsProfile(false)}
              style={{
                color:
                  active === "msg"
                    ? Theme.button.active
                    : Theme.button.inactive,
              }}
            ></i>} */}
            {/* <i className="fa-solid fa-code  cursor-pointer " title="Code"></i> */}
            {/* {<i
              className="fa-solid fa-video cursor-pointer"
              title="Video calls"
              onClick={() => handleClick("vid")}
              style={{
                color:
                  active === "vid"
                    ? Theme.button.active
                    : Theme.button.inactive,
              }}
            ></i>} */}
            {/* {<i
              className="fa-solid fa-users-line cursor-pointer"
              title="Plugins"
              onClick={() => {
                handleClick("group");
                setShowGroupSection(true);
              }}
              style={{
                color:
                  active === "group"
                    ? Theme.button.active
                    : Theme.button.inactive,
              }}
            ></i>} */}
          </div>
          <div className="flex flex-col gap-3 lg:text-xl text-sm">
            {/* <i className="fa-solid fa-hand-point-up"></i> */}
              
            <div 
            id="AddChannel"
              // onClick={openInviteModal}
              onClick={() => {
                navigate('/channel')
              }}
              
              className="flex flex-col items-center py-2 rounded-md cursor-pointer
                          bg-transparent group-hover:bg-[#90e0ef] hover:bg-gray-100 transition-all duration-200"
              title="Add Channel"
            >
              <i className="fa-solid fa-square-rss text-2xl"></i>
              <span className="text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                Channel
              </span>
            </div>
            <div 
            id="Home"
              // onClick={openInviteModal}
              onClick={() => {
                setIsProfile(false);
                setOpen(false);
                setOpenInvite(false);
                onReset();
              }}
              
              className="flex flex-col items-center py-2 rounded-md cursor-pointer
                          bg-transparent group-hover:bg-[#90e0ef] hover:bg-gray-100 transition-all duration-200"
              title="Home"
            >
              <i
              
                className="fa-solid fa-house text-xl"
              ></i>

              <span className="text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                HOME
              </span>
            </div>
            <div 
            id="addFriend"
              onClick={openInviteModal}
              
              className="flex flex-col items-center py-2 rounded-md cursor-pointer
                          bg-transparent group-hover:bg-[#90e0ef] hover:bg-gray-100 transition-all duration-200"
              title="Invite Friends"
            >
              <i
              
                className="fa-solid fa-user-plus text-xl"
              ></i>

              <span className="text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                FRIENDS
              </span>
            </div>


            <div
              onClick={() => {
                openBoardCastModal();
                tractBraodcastMessage();
              }}
              className="flex flex-col items-center py-2 px-1 rounded-md cursor-pointer
                          bg-transparent group-hover:bg-[#90e0ef] hover:bg-gray-100 transition-all duration-200" title="BroadCast">
              <i
                className="fa-solid fa-bullhorn cursor-pointer text-xl"


              ></i>
              <span className="text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200">BROADCAST</span>
            </div>



              
            <div
              onClick={() => setOpen(!open)}
              title="Requests"
              className=" flex flex-col items-center py-2 rounded-md cursor-pointer
                          bg-transparent group-hover:bg-[#90e0ef] hover:bg-gray-100 transition-all duration-200">
              <div

                className="flex flex-col items-center"
              >
                {open ? (
                  <i className="fa-regular fa-envelope-open cursor-pointer text-xl"></i>
                ) : (
                  <i className="fa-regular fa-envelope cursor-pointer text-xl"></i>
                )}

               {requests.length > 0 &&  <span className="bg-red-600 p-[4px] rounded-full   absolute "></span>}
                <span className="text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200">REQUESTS</span>
              </div>
              
              
            </div>
                  {/* {requests.length > 0 && (
  <div className="absolute left-20 bottom-[36%] z-50">
    
    
    <div className="absolute left-[-6px] top-3 w-3 h-3 bg-blue-400 rotate-45"></div>

    
    <div className="bg-blue-400 px-3 py-2 rounded-md shadow-lg flex flex-col gap-2">
      
      {requests.map((req) => (
        <img
          key={req._id}
          className="rounded-full w-7 h-7 object-cover"
          src={req.picture}
          alt=""
        />
      ))}

    </div>
  </div>
)} */}
            <AnimatePresence>
                {open && (
                  <motion.div
                    key={JSON.stringify(requests)}
                    initial={{ opacity: 0, x: -40, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.8 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 20,
                      mass: 0.6,
                    }}
                    className="popup absolute bottom-1/12 rounded-lg left-12 md:left-15 bg-blue-300 z-20 p-2 "
                  >
                    <div className="flex">
                    
                    <div>
                      <div className="flex justify-end py-2 "><i onClick={() => setOpen(!open)}  className="fa-solid fa-xmark bg-red-500 px-2 py-0.5 rounded text-white cursor-pointer" title="close"></i></div>
                      <div className="flex  items-center gap-1 justify-between ">
                      <h3>Friend Requests</h3>
                      {/* {forSender?.friendRequestsReceived?.length > 0 ? (
                        <div className="bg-black w-4 h-4 rounded-full text-white text-[0.6rem]  text-center flex items-center justify-center font-semibold">
                          {requests.length}
                        </div>
                      ) : (
                        ""
                      )} */}
                      {requests.length > 0 && (<button onClick={handleAcceptAll} className="text-xs bg-blue-500 px-2 rounded-xl font-semibold text-white">accept all</button>)}
                    </div>
                    
                    {requests.length === 0 ? (
                      <p className="text-xs">No new requests.</p>
                    ) : (
                      <AnimatePresence>
                        <div className="h-56 overflow-y-scroll p-2" style={{ scrollbarWidth: "none" }}>
                          {/* {[...requests,...requests,...requests,...requests,...requests,...requests,...requests,...requests,...requests,...requests,...requests].map((req) => ( */}
                          {requests.map((req) => (
                            <motion.div
                              layout
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6, x: 50 }}
                              transition={{ duration: 0.2 }}
                              key={req._id}
                              className="request-item flex items-center justify-between mb-2 px-2 py-1 rounded-xl"
                              style={{ backgroundColor: Theme.thirdBackgroundColor }}
                            >
                              <div className="flex items-end gap-2">
                                <img
                                  className="w-7 h-7 rounded-full"
                                  src={req.picture}
                                  alt={req.name}
                                />
                                <p className="text-xs font-semibold uppercase">
                                  {req.name}
                                </p>
                              </div>
                              <div className="flex flex-col justify-between gap-2 p-1">
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleDecline(req._id)}
                                    className="bg-red-100 p-0.5 rounded-md text-xs cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    onClick={() => handleAccept(req._id)}
                                    className="bg-amber-300 p-1 rounded-md text-xs cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    )}
                    <div className="flex flex-col justify-center items-center mt-2">
                      <div className="flex items-center gap-2 bg-gray-200  rounded-sm">
                        <button
                          className="text-xs font-medium px-1 cursor-pointer"
                          onClick={() =>
                            copyToClipboard(
                              `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${user.inviteNumber}`,
                            )
                          }
                        >
                          Invite Friend
                        </button>
                        <i
                          onClick={() =>
                            copyToClipboard(
                              `${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${user.inviteNumber}`,
                            )
                          }
                          className="cursor-pointer fa-solid fa-copy text-white bg-gray-500 p-1  text-xs font-medium rounded-tr-sm rounded-br-sm"
                        ></i>
                        {alertVisible && (
                          <div className="fixed mt-2 top-0 right-0 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-4 shadow-md flex items-start gap-3 max-w-sm transition-transform ">
                            <span className="text-blue-500 text-xl">✓</span>
                            <div className="flex-1">
                              <p className="font-semibold">
                                Copied to clipboard!
                              </p>
                              <p className="text-sm break-all">{copied}</p>
                            </div>
                            <button
                              className="text-slate-500 hover:text-slate-700 text-lg"
                              onClick={() => setAlertVisible(false)}
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-xs underline ">
                        copy url then Share{" "}
                      </span>
                    </div>
                    </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            <div onClick={() => setIsProfile(true)} className="flex flex-col items-center py-2 rounded-md cursor-pointer
                          bg-transparent group-hover:bg-[#90e0ef] hover:bg-gray-100 transition-all duration-200">
              <i
                className="fa-solid fa-user"
                
              ></i>
              <span className="text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200">PROFILE</span>
            </div>

            {/* <div className="flex flex-col items-center py-2 rounded-md cursor-pointer
                          bg-transparent group-hover:bg-[#90e0ef] hover:bg-gray-100 transition-all duration-200">
              <i className="fa-solid fa-gear"></i>
              <span className="text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200">SETTINGS</span>
            </div> */}
          </div>
        </div>

        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={customStyles}
        >
          <p>this is the content </p>
        </Modal>
      </div>
      <AnimatePresence>
        {BroadCastModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-200 p-5 rounded-xl max-h-1/2 overflow-y-scroll"
              initial={{ scale: 1 }}
              animate={{ scale: 0.9 }}
              exit={{ scale: 1 }}
              style={{
                scrollbarWidth: "none",
                backgroundColor: Theme.thirdBackgroundColor,
              }}
            >
              <div className="flex justify-end py-2 sticky top-0 z-20">
                <p
                  onClick={closeBoardCastModal}
                  className="px-3 py-1 rounded-md font-bold cursor-pointer"
                >
                                  <i   className="fa-solid fa-xmark bg-red-500 px-3 py-1.5 rounded text-white cursor-pointer" title="close"></i>

                </p>
              </div>

              {isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <SkeletonCard key={i} i={i} />
                  ))}
                </>
              ) :
                Object.keys(groupedBroadcasts).length === 0 ? (
                  <div className="text-gray-500 text-center flex flex-col items-center gap-2">
                    <span className="text-3xl">🫤</span>
                    <p className="font-semibold">No Annoucement</p>
                    <span
                      className="text-sm font-semibold hover:underline cursor-pointer"
                      onClick={closeBoardCastModal}
                    >
                      Make a new Annoucement here !
                    </span>
                  </div>
                ) : (
                  Object.entries(groupedBroadcasts).map(([date, items]) => (
                    <div key={date} className="mb-6">

                      {/*  DATE HEADER */}
                      <div className="flex justify-center mb-4 sticky top-0 z-20">
                        <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full shadow">
                          {date}
                        </span>
                      </div>

                      {/*  BROADCASTS */}
                      {
                        items.map((d, i) => (
                          <motion.div
                            key={d?._id || i}
                            layout
                            initial={{ opacity: 0, scale: 0.8, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.7, x: 20 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                            }}
                            className="mb-3 flex justify-start"
                          >
                            <div className="max-w-[80%] bg-[#1e293b] rounded-2xl shadow-xl border border-white/10 p-3 relative backdrop-blur-md">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-2 gap-4">
                                <span className="text-[14px] bg-blue-500/90 text-white px-2 py-[2px] rounded-full font-semibold flex items-center gap-1">
                                  <i className="fa-solid fa-bullhorn text-[10px]"></i>
                                  BROADCAST
                                </span>

                                <span className="text-[14px] text-gray-400 font-semibold">
                                  {new Date(d.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {/* Message */}
                              <div
                                className="text-md text-gray-200 leading-relaxed break-words [&_*]:text-gray-200"
                                dangerouslySetInnerHTML={{ __html: d?.text }}
                              />

                              {/* Footer */}
                              <div className="flex items-center justify-end gap-4 mt-3 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1 text-sm">
                                  <i className="fa-regular fa-eye text-white"></i>{" "}
                                  {d.seenCount}
                                </span>

                                <span className="flex items-center gap-1">
                                  <i className="fa-solid fa-users"></i>{" "}
                                  {d.totalRecipients}
                                </span>
                              </div>

                              <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent"></div>
                            </div>
                          </motion.div>
                        ))
                      }
                    </div>
                  ))
                )
              }

            </motion.div>
          </motion.div>
        )}
        {openInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[999]"
          >
            <motion.div
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 40 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              id="inviteFriendModal"
              className="relative w-[90%] max-w-sm bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-5 flex flex-col items-center gap-4 border border-white/20"
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={closeInviteModal}
                className="absolute top-3 right-3 text-white px-2 rounded-md hover:text-black text-lg"
              >
                <i   className="fa-solid fa-xmark bg-red-500 px-2 py-0.5 rounded text-white cursor-pointer" title="close"></i>
              </button>

              {/* TITLE */}
              <h2 className="text-lg font-semibold text-gray-800">
                Invite Friends
              </h2>

              {/* QR BOX */}
              <div id="scanQrcodetoinvitefriend" className="bg-white p-3 rounded-xl shadow-inner border border-gray-200">
                <QRCode
                  value={`https://merchantcoin.shop/friend-invitation?invitecode=${user.inviteNumber}`}
                  logoImage={Logo}
                  logoWidth={35}
                  logoHeight={25}
                  logoPadding={2}
                  logoPaddingStyle="circle"
                  removeQrCodeBehindLogo={true}
                  ecLevel="H"
                />
              </div>

              {/* INVITE LINK */}
              {/* <p className="text-[11px] text-gray-500 text-center break-all">
                {`${import.meta.env.VITE_BACK_DEV_API}/frnd-req/${user.inviteNumber}`}
              </p> */}

             <div className="flex gap-2" id="yourinviteid">
              <span>Your Invite ID</span>
               
                <div className="flex gap-3 items-center px-2 text-[#333] font-semibold rounded-md" style={{ background: Theme.thirdBackgroundColor }}>
                <span>{user.inviteNumber}</span>
                <motion.i
                key={copyTick ? "check" : "copy"}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={
                  copyTick
                    ? "fa-solid fa-check text-green-600"
                    : "fa-regular fa-copy cursor-pointer"
                }
                onClick={() => !copyTick && copyToClipboard(user.inviteNumber)}
              />
              </div>

             </div>

              {/* ACTION BUTTONS */}
              <div  className="flex gap-3 w-full">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `https://merchantcoin.shop/friend-invitation?invitecode=${user.inviteNumber}`,
                    )
                  }
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-xs py-2 rounded-md"
                >
                  Copy Link
                </button>

                <button
                  onClick={() =>
                    navigator.share?.({
                      title: "Join me on chat",
                      text: "Join me on chat",
                      url: `https://merchantcoin.shop/friend-invitation?invitecode=${user.inviteNumber}`,
                    })
                  }
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 rounded-md"
                >
                  Share
                </button>
              </div>
              <div className="w-full flex flex-col gap-2 mt-2">
                <p className="text-xs text-gray-500 text-center">
                  Or enter invite code
                </p>

                <div  id="actionbutton" className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 10-digit code"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />

                  <button
                    onClick={sendInviteByCode}
                    disabled={inviteLoading}
                    className="bg-blue-500 hover:bg-blue-200 hover:font-semibold hover:text-black cursor-pointer text-white px-3 py-2 rounded-md text-sm"
                  >
                    {inviteLoading ? "..." : "Add"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {inviteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="fixed top-5 right-5 bg-green-500 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-[9999]"
          >
            <span className="text-lg">✅</span>
            <span className="text-sm font-medium">Request Sent</span>
          </motion.div>
        )}
        {inviteError && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="fixed top-5 right-5 bg-red-500 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-[9999]"
          >
            <span className="text-lg">❌</span>
            <span className="text-sm font-medium">Invalid Code</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
  {showTourPrompt && (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 20 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.3 }}
      className="fixed  top-0 left-1/2 -translate-x-1/2 z-[9999]"
    >
       <div className="bg-white shadow-xl border border-gray-200 rounded-xl px-4 py-3 flex flex-col  gap-4">
        
        <div className="flex items-center  gap-3">
          <div>
          <p className="text-sm font-semibold text-gray-800">
            Take a quick tour?
          </p>
        </div>
        <div className="flex ">
          <button
            onClick={skipTour}
            className="text-xs px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Skip
          </button>

        </div>
        </div>

       <div className="grid grid-cols-1 gap-2">

         <div className="flex items-baseline gap-2">
          <p className="text-xs text-gray-500">
            Learn how to add friends and use features.
          </p>
          <button
            onClick={startTour}
            className="text-xs px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            Start
          </button>
        </div>

         {/* <div className="flex items-baseline gap-2 justify-between">
          <p className="text-xs text-gray-500">
            Learn How to Broadcast your  message.
          </p>
          <button
            onClick={startTour}
            className="text-xs px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            Start
          </button>
        </div>

         <div className="flex items-baseline gap-2 justify-between">
          <p className="text-xs text-gray-500">
            Learn How to Create Channel.
          </p>
          <button
            onClick={startTour}
            className="text-xs px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            Start
          </button>
        </div> */}
        

       </div>
      {/* <div className="flex items-center justify-between px-2 font-semibold text-xs">
          <span>
          Complete
        </span>
        <span>1/3</span>
      </div> */}
      </div>
    
    </motion.div>
  )}
</AnimatePresence>
    </>
  );
}
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};
