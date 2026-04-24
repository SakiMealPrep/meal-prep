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
      setError("Otvori ponovo link za reset lozinke iz emaila da bi zapoceo/la bezbednu recovery sesiju.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju.");
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Azuriranje lozinke nije uspelo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Izaberi novu lozinku" subtitle="Unesi novu lozinku za svoj nalog.">
      {checkingRecovery && <StatusMessage type="info">Proveravam recovery sesiju...</StatusMessage>}
      {!checkingRecovery && !recoveryReady && !success && (
        <StatusMessage type="info">
          Ova stranica radi samo kada je otvoris iz linka za reset lozinke koji si dobio/la emailom.
        </StatusMessage>
      )}
      {success && <StatusMessage type="success">Lozinka je uspesno azurirana.</StatusMessage>}
      {error && <StatusMessage type="error">{error}</StatusMessage>}
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          Nova lozinka
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={6}
            required
          />
        </label>
        <label>
          Potvrdi lozinku
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            minLength={6}
            required
          />
        </label>
        <button type="submit" disabled={submitting || success || checkingRecovery || !recoveryReady}>
          {submitting ? "Cuvam..." : "Sacuvaj lozinku"}
        </button>
      </form>
      <div className="auth-links">
        {success ? <Link to={routes.household}>Nastavi dalje</Link> : <Link to={routes.forgotPassword}>Zatrazi novi link za reset</Link>}
      </div>
    </AuthLayout>
  );
}
