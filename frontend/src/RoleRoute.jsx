import { Navigate } from "react-router-dom";

function RoleRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  if (!token || !userData) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userData);

  if (user?.role !== allowedRole) {
    // Redirect users to their own dashboard
    if (user?.role === "Employee") {
      return <Navigate to="/employee" replace />;
    }

    if (user?.role === "Reviewer") {
      return <Navigate to="/reviewer" replace />;
    }

    if (user?.role === "Manager") {
      return <Navigate to="/manager" replace />;
    }

    if (user?.role === "Administrator") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RoleRoute;