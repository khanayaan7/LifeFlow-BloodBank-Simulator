import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function defaultRouteForRole(role) {
  if (role === "hospital_staff") return "/requests";
  if (role === "donor") return "/donor";
  return "/";
}

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const fallbackPath = defaultRouteForRole(user.role);
    return <Navigate to={fallbackPath} replace />;
  }
  return children;
}
