// src/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import MainApp from "./App";
import ProtectedRoute from "./ProctectedRoutes";
import App from "../App"; // your login screen
import PersonalInfo from "./Profile/PersonalInfo";
import GroupChat from "./Group";
import { CreateChannel } from "./CreateChannel/CreateChannel";
import { VideoCall } from "./VideoCall/VideoCall";
import { RoomJoin } from "./VideoCall/RoomJoin";

export default function AppRoutes({ clientId }) {
  return (
    <Routes>
      <Route path="/" element={<App clientId={clientId} />} />
      <Route
        path="/chats"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <PersonalInfo />
          </ProtectedRoute>
        }
      /> */}
      <Route
        path="/groupChat"
        element={
          <ProtectedRoute>
            <GroupChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/channel"
        element={
          <ProtectedRoute>
            <CreateChannel/>
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/video"
        element={
          // <ProtectedRoute>
            <VideoCall/>
          // </ProtectedRoute>
        }
      />
      <Route
        path="/joinroom"
        element={
          <ProtectedRoute>
            <RoomJoin/>
          </ProtectedRoute>
        }
      /> */}
    </Routes>
  );
}


