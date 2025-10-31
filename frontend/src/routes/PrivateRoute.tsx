import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

type PrivateRouteProps = {
  allowedRoles: Array<"admin" | "recepcionista" | "camareira">;
  element?: React.ReactNode;
};

export default function PrivateRoute({ allowedRoles, element }: PrivateRouteProps) {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return element ? <>{element}</> : <Outlet />;
}
