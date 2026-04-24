import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../contexts/AuthContext";
import { signUpWithEmail } from "../lib/auth";
import { getRedirectTo, routes } from "../lib/routes";

export function SignupPage() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const redirectTo = getRedirectTo(location.search);

  if (!loading && isAuthenticated) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await signUpWithEmail(email, password, redirectTo);
      navigate(
        `${routes.checkEmail}?mode=signup&email=${encodeURIComponent(email)}&redirectTo=${encodeURIComponent(redirectTo)}`,
        { replace: true },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Confirm your email, then continue into your household.">
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
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <div className="auth-links">
        <Link to={`${routes.login}?redirectTo=${encodeURIComponent(redirectTo)}`}>Already have an account?</Link>
      </div>
    </AuthLayout>
  );
}
