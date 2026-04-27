import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContex";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (!user) {
    const redirectUrl = location.pathname + location.search;
    localStorage.setItem("redirectAfterLogin", redirectUrl);
    return <Navigate to="/" />
  };
  return children;
};

export default ProtectedRoute;
