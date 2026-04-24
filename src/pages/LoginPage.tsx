import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../contexts/AuthContext";
import { resendConfirmationEmail, signInWithEmail } from "../lib/auth";
import { getRedirectTo, routes } from "../lib/routes";

export function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const redirectTo = getRedirectTo(location.search);
  const needsEmailConfirmation = /confirm|verified|verification|email not confirmed/i.test(error);

  if (!loading && isAuthenticated) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await signInWithEmail(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    if (!email) {
      setError("Enter your email first so we know where to resend the confirmation link.");
      return;
    }

    setResending(true);
    setMessage("");

    try {
      await resendConfirmationEmail(email, redirectTo);
      setMessage(`We sent a fresh confirmation link to ${email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend confirmation email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your household meal planning.">
      {message && <StatusMessage type="success">{message}</StatusMessage>}
      {error && <StatusMessage type="error">{error}</StatusMessage>}
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={6}
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="auth-links">
        <Link to={routes.forgotPassword}>Forgot password?</Link>
        <Link to={`${routes.signup}?redirectTo=${encodeURIComponent(redirectTo)}`}>Create account</Link>
        {needsEmailConfirmation && (
          <button type="button" className="secondary-button" onClick={handleResendConfirmation} disabled={resending}>
            {resending ? "Sending..." : "Resend confirmation email"}
          </button>
        )}
      </div>
    </AuthLayout>
  );
}
