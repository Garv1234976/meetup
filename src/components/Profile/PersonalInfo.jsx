import { useAuth } from "../../context/AuthContex";

const UserProfile = () => {
  const { user, setUser } = useAuth();

  const clearAllCookies = () => {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie =
        name +
        "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
    });
  };




const handleLogout = async () => {
  try {
    await fetch(`${import.meta.env.VITE_BACK_DEV_API}/api/logout`, {
      method: "POST",
      credentials: "include", 
    });
  } catch (err) {
    console.log("Logout error", err);
  }

  localStorage.clear();
  sessionStorage.clear();
  setUser(null);

  window.location.href = "/";
};
  if (!user) {
    return <div className="p-4 text-left">No user data</div>;
  }

  return (
    <div className="w-full h-full bg-white p-6 rounded-md">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b pb-4">
        <img
          src={user.picture}
          alt="profile"
          className="w-16 h-16 rounded-full border object-cover"
        />

        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* PROFILE LIST */}
      <ul className="mt-6 flex flex-col gap-3 max-w-xl">

        {/* <li className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
          <i className="fa-solid fa-user text-gray-600"></i>
          <span className="text-sm break-all">ID: {user._id}</span>
        </li> */}

        <li className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
          <i className="fa-solid fa-envelope text-gray-600"></i>
          <span className="text-sm">{user.email}</span>
        </li>

        <li className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
          <i className="fa-solid fa-phone text-gray-600"></i>
          <span className="text-sm">Invite: {user.inviteNumber}</span>
        </li>

        <li className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
          <i className="fa-solid fa-user-group text-gray-600"></i>
          <span className="text-sm">
            Friend Requests: {user.requestCount}
          </span>
        </li>

        {/* LOGOUT */}
        <li
          onClick={handleLogout}
          className="flex items-center gap-2 p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl cursor-pointer transition w-fit"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          Logout
        </li>
      </ul>
    </div>
  );
};

export default UserProfile;