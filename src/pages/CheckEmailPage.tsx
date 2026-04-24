import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { routes } from "../lib/routes";

const copy = {
  signup: {
    title: "Check your inbox",
    subtitle: "We sent a confirmation link to finish creating your account.",
    hint: "Open the email on this device and tap the confirmation button to continue.",
  },
  reset: {
    title: "Reset link sent",
    subtitle: "We emailed you a secure password reset link.",
    hint: "Open the email and continue on the same browser so we can verify the recovery session.",
  },
} as const;

export function CheckEmailPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "reset" ? "reset" : "signup";
  const email = searchParams.get("email") ?? "";
  const currentCopy = copy[mode];

  return (
    <AuthLayout title={currentCopy.title} subtitle={currentCopy.subtitle}>
      <div className="status-message status-info">
        {email ? <>We sent the link to <strong>{email}</strong>.</> : currentCopy.hint}
      </div>
      <p className="muted-copy">{currentCopy.hint}</p>
      <div className="auth-links">
        <Link to={routes.login}>Back to sign in</Link>
        {mode === "reset" ? <Link to={routes.forgotPassword}>Send another reset link</Link> : <Link to={routes.signup}>Use another email</Link>}
      </div>
    </AuthLayout>
  );
}
