// import { useEffect, useState, useRef } from "react";
// import {
//   Room,
//   RoomEvent,
//   Track
// } from "livekit-client";
// import { motion } from "framer-motion";
// import { useSearchParams } from "react-router-dom";

export function VideoCall() {
  // const [searchParams] = useSearchParams();
  // const roomId = searchParams.get("roomid");

  // const [room, setRoom] = useState(null);
  // const [isHost, setIsHost] = useState(false);
  // const [hostIdentity, setHostIdentity] = useState("");

  // const [participants, setParticipants] = useState({});
  // const [localTrack, setLocalTrack] = useState(null);

  // const [micOn, setMicOn] = useState(true);
  // const [camOn, setCamOn] = useState(true);
  // const [joined, setJoined] = useState(false);

  // useEffect(() => {
  //   if (!joined) return;

  //   let roomInstance;

  //   const start = async () => {
  //     roomInstance = new Room();
  //     setRoom(roomInstance);

  //     // 🔥 GET TOKEN
  //     const res = await fetch("https://gxtf9x0d-5000.inc1.devtunnels.ms/get-token", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify({
  //         room: roomId,
  //         username: "user_" + Math.floor(Math.random() * 1000),
  //       })
  //     });

  //     const data = await res.json();

  //     setIsHost(data.isHost);
  //     setHostIdentity(data.hostIdentity);

  //     // 🔥 CONNECT
  //     await roomInstance.connect("wss://meetup-l3tx8bbx.livekit.cloud", data.token);

  //     // 🎥 ENABLE CAMERA/MIC (after user click → no audio error)
  //     await roomInstance.localParticipant.enableCameraAndMicrophone();

  //     // ✅ LOCAL TRACK (SAFE)
  //     roomInstance.on(RoomEvent.LocalTrackPublished, (pub) => {
  //       if (pub.track?.kind === Track.Kind.Video) {
  //         setLocalTrack(pub.track);
  //       }
  //     });

  //     const camPub = Array.from(
  //       roomInstance.localParticipant.videoTrackPublications.values()
  //     )[0];
  //     if (camPub?.track) setLocalTrack(camPub.track);

  //     // =====================================================
  //     // ✅ ONLY RELIABLE TRACK HANDLER (NO RACE CONDITIONS)
  //     // =====================================================

  //     roomInstance.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
  //       if (track.kind !== Track.Kind.Video) return;

  //       console.log("🎥 RECEIVED:", participant.identity);

  //       setParticipants((prev) => ({
  //         ...prev,
  //         [participant.identity]: track,
  //       }));
  //     });

  //     roomInstance.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
  //       setParticipants((prev) => {
  //         const copy = { ...prev };
  //         delete copy[participant.identity];
  //         return copy;
  //       });
  //     });
  //   };

  //   start();

  //   return () => {
  //     roomInstance?.disconnect();
  //   };
  // }, [joined, roomId]);

  // // 🎯 LOGIC
  // const hostTrack = participants[hostIdentity];
  // const audienceTracks = Object.entries(participants).filter(
  //   ([id]) => id !== hostIdentity
  // );

  // // 🎛 CONTROLS
  // const toggleMic = async () => {
  //   if (!room) return;
  //   await room.localParticipant.setMicrophoneEnabled(!micOn);
  //   setMicOn(!micOn);
  // };

  // const toggleCam = async () => {
  //   if (!room) return;
  //   await room.localParticipant.setCameraEnabled(!camOn);
  //   setCamOn(!camOn);
  // };

  // const leaveRoom = () => {
  //   room?.disconnect();
  //   window.location.href = "/";
  // };

  // // 🔥 JOIN SCREEN (fixes AudioContext issue)
  // if (!joined) {
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-black">
  //       <button
  //         onClick={() => setJoined(true)}
  //         className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-xl text-white text-xl"
  //       >
  //         Join Call
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <></>
    // <div className="bg-black min-h-screen text-white flex flex-col">

    //   {/* 🎥 MAIN VIDEO */}
    //   <div className="flex-1 flex justify-center items-center p-4">
    //     {isHost ? (
    //       localTrack && <Video track={localTrack} label="👑 You (Host)" big />
    //     ) : (
    //       hostTrack && <Video track={hostTrack} label="👑 Host" big />
    //     )}
    //   </div>

    //   {/* 👥 HOST VIEW */}
    //   {isHost && (
    //     <motion.div
    //       className="flex gap-4 p-4 overflow-x-auto bg-black/60"
    //       initial={{ y: 100 }}
    //       animate={{ y: 0 }}
    //     >
    //       {audienceTracks.map(([id, track]) => (
    //         <Video key={id} track={track} label={`👤 ${id}`} />
    //       ))}
    //     </motion.div>
    //   )}

    //   {/* 👤 AUDIENCE SELF VIEW */}
    //   {!isHost && localTrack && (
    //     <motion.div
    //       className="fixed bottom-24 right-4 w-40"
    //       initial={{ scale: 0 }}
    //       animate={{ scale: 1 }}
    //     >
    //       <Video track={localTrack} label="👤 You" />
    //     </motion.div>
    //   )}

    //   {/* 🎛 CONTROLS */}
    //   <div className="h-20 bg-black/80 flex justify-center items-center gap-6">

    //     <button onClick={toggleMic} className="w-12 h-12 rounded-full bg-gray-800">
    //       <i className={`fa-solid ${micOn ? "fa-microphone" : "fa-microphone-slash"}`} />
    //     </button>

    //     <button onClick={toggleCam} className="w-12 h-12 rounded-full bg-gray-800">
    //       <i className={`fa-solid ${camOn ? "fa-video" : "fa-video-slash"}`} />
    //     </button>

    //     <button onClick={leaveRoom} className="w-14 h-14 rounded-full bg-red-600">
    //       <i className="fa-solid fa-phone-slash text-lg" />
    //     </button>

    //   </div>
    // </div>
  );
}

// 🎥 VIDEO COMPONENT
// const Video = ({ track, label, big }) => {
//   const ref = useRef();

//   useEffect(() => {
//     if (!track || !ref.current) return;

//     const el = track.attach();
//     ref.current.innerHTML = "";
//     ref.current.appendChild(el);

//     return () => {
//       track.detach(el);
//     };
//   }, [track]);

//   return (
//     <motion.div
//       className={`${big ? "w-[600px]" : "w-40"} relative`}
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//     >
//       <div ref={ref} className="w-full rounded-xl overflow-hidden bg-black" />

//       <div className="absolute bottom-0 left-0 bg-black/60 px-2 py-1 text-sm">
//         {label}
//       </div>
//     </motion.div>
//   );
// };