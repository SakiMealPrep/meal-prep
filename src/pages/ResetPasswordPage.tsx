import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../contexts/AuthContext";
import { updatePassword } from "../lib/auth";
import { routes } from "../lib/routes";
import { getSupabaseClient } from "../lib/supabase";

export function ResetPasswordPage() {
  const { session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);

  useEffect(() => {
    async function checkRecoverySession() {
      const supabase = getSupabaseClient();
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashType = hash.get("type");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (hashType === "recovery" && accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(sessionError.message);
          setCheckingRecovery(false);
          return;
        }

        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        setRecoveryReady(true);
        setCheckingRecovery(false);
        return;
      }

      setRecoveryReady(Boolean(session));
      setCheckingRecovery(false);
    }

    if (!loading) checkRecoverySession();
  }, [loading, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!recoveryReady) {
      setError("Open the password reset link from your email again to start a secure recovery session.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Enter a new password for your account.">
      {checkingRecovery && <StatusMessage type="info">Checking your recovery session...</StatusMessage>}
      {!checkingRecovery && !recoveryReady && !success && (
        <StatusMessage type="info">
          This page works only from the password reset link in your email.
        </StatusMessage>
      )}
      {success && <StatusMessage type="success">Password updated successfully.</StatusMessage>}
      {error && <StatusMessage type="error">{error}</StatusMessage>}
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          New password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={6}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            minLength={6}
            required
          />
        </label>
        <button type="submit" disabled={submitting || success || checkingRecovery || !recoveryReady}>
          {submitting ? "Saving..." : "Save password"}
        </button>
      </form>
      <div className="auth-links">
        {success ? <Link to={routes.household}>Continue</Link> : <Link to={routes.forgotPassword}>Request a new reset link</Link>}
      </div>
    </AuthLayout>
  );
}
