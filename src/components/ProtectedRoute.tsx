import { Navigate, Outlet, useLocation } from "react-router-dom";
import { routes, withRedirect } from "../lib/routes";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <main className="centered-page">Loading your session...</main>;

  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate to={withRedirect(routes.login, redirectTo)} replace />;
  }

  return <Outlet />;
}
