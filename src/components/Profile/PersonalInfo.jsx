import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContex";
import { motion, AnimatePresence } from "framer-motion";

const UserProfile = () => {
  const { user, setUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
   const [enableTour, SetEnableTour] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });


  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        password: "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      const onlyNums = value.replace(/\D/g, "");
      if (onlyNums.length > 10) {
        setError("Phone must be 10 digits");
        return;
      }
      setError("");
      setForm((prev) => ({ ...prev, phoneNumber: onlyNums }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (form.phoneNumber && form.phoneNumber.length !== 10) {
      setError("Phone must be 10 digits");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACK_DEV_API}/api/user`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password || undefined,
            phoneNumber: form.phoneNumber || null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Update failed");
        return;
      }

      setUser((prev) => ({
        ...prev,
        ...data.user,
      }));

      setIsEditing(false);
    } catch {
      setError("Update failed");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACK_DEV_API}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    window.location.href = "/";
  };

  if (!user) {
    return <div className="p-4">No user data</div>;
  }

  return (
    <div className="w-full h-full bg-white p-4 sm:p-6 rounded-md flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b pb-4">

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>

          <div className="break-all">
            <h2 className="text-base sm:text-lg font-semibold">{user.name}</h2>
            <p className="text-xs sm:text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-2 flex-wrap">

          {!isEditing ? (
            <div
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 cursor-pointer bg-blue-500 px-3 py-1.5 rounded-md text-white text-sm"
            >
              Edit
              <i className="fa-solid fa-pen"></i>
            </div>
          ) : (
            <>
              <div
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-500 px-3 py-1.5 rounded-md text-white text-sm cursor-pointer"
              >
                Save
                <i className="fa-solid fa-check"></i>
              </div>

              <div
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-md text-white text-sm cursor-pointer"
              >
                Cancel
                <i className="fa-solid fa-xmark"></i>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ERROR */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-500 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORM */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col gap-4 w-full"
      >

        {/* NAME */}
        {isEditing ? (
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Name"
          />
        ) : (
          <div className="bg-gray-100 p-3 rounded text-sm sm:text-base">
            Name: {user.name}
          </div>
        )}

        {/* EMAIL */}
        {isEditing ? (
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Email"
          />
        ) : (
          <div className="bg-gray-100 p-3 rounded text-sm sm:text-base">
            Email: {user.email}
          </div>
        )}

        {/* PHONE */}
        {isEditing ? (
          <input
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Phone (10 digit)"
          />
        ) : (
          <div className="bg-gray-100 p-3 rounded text-sm sm:text-base">
            Phone: {user.phoneNumber || "Not added"}
          </div>
        )}

        {/* STATUS */}
        {!isEditing && (
          <div className="bg-gray-100 p-3 rounded text-sm sm:text-base">
            Status:{" "}
            {user.isVerify ? (
              <span className="text-green-600 font-semibold">Verified</span>
            ) : (
              <span className="text-yellow-600 font-semibold">
                Not verified
              </span>
            )}
          </div>
        )}

        {/* PASSWORD */}
        {isEditing && (
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="New Password (optional)"
          />
        )}
      </motion.div>

      {/* LOGOUT */}
      <div

      onClick={() => {
        localStorage.setItem("tourActive", "true");
        window.location.reload(); 
      }}
      >
        <span className="bg-gray-500 py-1 text-white font-semibold px-2 rounded-lg">Enable Tour again</span>
      </div>
      <div
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl cursor-pointer w-full sm:w-fit"
      >
        <i className="fa-solid fa-right-from-bracket"></i>
        Logout
      </div>
    </div>
  );
};

export default UserProfile;