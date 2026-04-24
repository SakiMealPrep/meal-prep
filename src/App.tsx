import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { CheckEmailPage } from "./pages/CheckEmailPage";
import { ConfigurationErrorPage } from "./pages/ConfigurationErrorPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { HouseholdPage } from "./pages/HouseholdPage";
import { InviteAcceptPage } from "./pages/InviteAcceptPage";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SignupPage } from "./pages/SignupPage";
import { routes } from "./lib/routes";
import { hasSupabaseConfig, supabaseConfigError } from "./lib/supabase";

export function App() {
  if (!hasSupabaseConfig) {
    return <ConfigurationErrorPage error={supabaseConfigError} />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path={routes.home} element={<HomePage />} />
          <Route path={routes.login} element={<LoginPage />} />
          <Route path={routes.signup} element={<SignupPage />} />
          <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={routes.checkEmail} element={<CheckEmailPage />} />
          <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
          <Route path={routes.authCallback} element={<AuthCallbackPage />} />
          <Route path={routes.acceptInvite} element={<InviteAcceptPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path={routes.household} element={<HouseholdPage />} />
          </Route>
          <Route path="*" element={<Navigate to={routes.home} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
