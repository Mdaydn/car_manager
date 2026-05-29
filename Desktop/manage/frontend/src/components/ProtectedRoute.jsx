import { Navigate } from "react-router-dom";
import { getStoredUser, resolveRole } from "../auth";

export default function ProtectedRoute({ children, allowedRole }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const role = resolveRole(user);
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === "admin" ? "/admin/monthly-report" : "/car"} replace />;
  }

  return children;
}
