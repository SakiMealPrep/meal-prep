import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { resolveAuthenticatedDestination } from "../lib/households";
import { routes } from "../lib/routes";
import { getSupabaseClient } from "../lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Hang tight while we finish signing you in.");

  useEffect(() => {
    async function finishAuth() {
      const supabase = getSupabaseClient();
      const redirectTo = searchParams.get("redirectTo") ?? routes.household;
      const code = searchParams.get("code");
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashError = hashParams.get("error_description") ?? hashParams.get("error");
      const type = hashParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (hashError) {
        setError(hashError);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }

        const destination = await resolveAuthenticatedDestination(
          redirectTo.startsWith("/") ? redirectTo : routes.household,
        );
        setMessage("Email confirmed. Redirecting you into the app...");
        if (destination === routes.legacyAppHome) {
          window.location.assign(destination);
          return;
        }

        navigate(destination, { replace: true });
        return;
      }

      if (type === "recovery" && accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        window.history.replaceState({}, document.title, routes.resetPassword);
        navigate(routes.resetPassword, { replace: true });
        return;
      }

      const destination = await resolveAuthenticatedDestination(
        redirectTo.startsWith("/") ? redirectTo : routes.household,
      );
      if (destination === routes.legacyAppHome) {
        window.location.assign(destination);
        return;
      }

      navigate(destination, { replace: true });
    }

    finishAuth();
  }, [navigate, searchParams]);

  return (
    <main className="centered-page">
      <section className="simple-panel">
        <h1>Confirming your email</h1>
        {error ? (
          <>
            <StatusMessage type="error">{error}</StatusMessage>
            <Link to={routes.login}>Back to sign in</Link>
          </>
        ) : (
          <p>{message}</p>
        )}
      </section>
    </main>
  );
}
