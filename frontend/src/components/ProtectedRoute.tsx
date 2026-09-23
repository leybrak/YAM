import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireCouple() {
  const user = useAuthStore((s) => s.user);
  if (user && !user.couple_id) return <Navigate to="/vinculo" replace />;
  return <Outlet />;
}
