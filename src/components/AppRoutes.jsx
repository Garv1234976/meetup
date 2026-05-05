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
import BroadcastChannelCreator from "./Broadcast/BroadcastChannelCreator";
import JoinChannelOverview from './Join/JoinChannelOverview';
import FriendInvitation from "./Join/FriendInvitation";
import TourPrompt from "./Tour/TourPrompt";
import { GetAllNotification } from "./Notification/GetAllNotification";
import { ExplorePeople } from "./ExplorePeople/ExplorePeople";
import { OnlinePanel } from "./Admin/Online";
import { FriendRequest } from "./FriendRequest/FriendRequest";
import ChannelSettings from "./ChannelSetting/ChannelSetting";
export default function AppRoutes({ clientId }) {
  return (
    <Routes>
      <Route path="/" element={<App clientId={clientId} />} />
      <Route
        path="/chats"
        element={
          <ProtectedRoute>
            <MainApp />
            <TourPrompt />
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
      <Route
        path="/broadcast"
        element={
          <ProtectedRoute>
            <BroadcastChannelCreator/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/join"
        element={
          <ProtectedRoute>
            <JoinChannelOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friend-invitation"
        element={
          <ProtectedRoute>
            <FriendInvitation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notification"
        element={
          <ProtectedRoute>
            <GetAllNotification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <ExplorePeople />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friend-request"
        element={
          <ProtectedRoute>
            <FriendRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/channel-settings"
        element={
          <ProtectedRoute>
            <ChannelSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-panel"
        element={
          // <ProtectedRoute>
            <OnlinePanel />
          // </ProtectedRoute>
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