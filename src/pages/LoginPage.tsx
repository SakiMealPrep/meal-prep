import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../contexts/AuthContext";
import { resolveAuthenticatedDestination } from "../lib/households";
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
      const destination = await resolveAuthenticatedDestination(redirectTo);
      if (destination === routes.legacyAppHome) {
        window.location.assign(destination);
        return;
      }

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prijava nije uspela.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    if (!email) {
      setError("Prvo unesi email adresu kako bismo znali gde da ponovo posaljemo link za potvrdu.");
      return;
    }

    setResending(true);
    setMessage("");

    try {
      await resendConfirmationEmail(email, redirectTo);
      setMessage(`Poslali smo novi link za potvrdu na adresu ${email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ponovno slanje email potvrde nije uspelo.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout title="Dobrodosao/la nazad" subtitle="Prijavi se da upravljas planiranjem obroka za svoje domacinstvo.">
      {message && <StatusMessage type="success">{message}</StatusMessage>}
      {error && <StatusMessage type="error">{error}</StatusMessage>}
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Lozinka
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={6}
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Prijavljujem..." : "Prijavi se"}
        </button>
      </form>
      <div className="auth-links">
        <Link to={routes.forgotPassword}>Zaboravljena lozinka?</Link>
        <Link to={`${routes.signup}?redirectTo=${encodeURIComponent(redirectTo)}`}>Napravi nalog</Link>
        {needsEmailConfirmation && (
          <button type="button" className="secondary-button" onClick={handleResendConfirmation} disabled={resending}>
            {resending ? "Saljem..." : "Posalji ponovo email potvrdu"}
          </button>
        )}
      </div>
    </AuthLayout>
  );
}
