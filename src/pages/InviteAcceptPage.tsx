import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../contexts/AuthContext";
import { acceptInvite, InvitePreview, previewInvite } from "../lib/households";
import { routes, withRedirect } from "../lib/routes";

const statusCopy: Record<string, string> = {
  invalid: "Ovaj link za pozivnicu nije vazeci.",
  expired: "Ova pozivnica je istekla. Zatrazi novu.",
  used: "Ova pozivnica je vec iskoriscena.",
  already_member: "Vec si clan ovog domacinstva.",
};

export function InviteAcceptPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const redirectHere = `${location.pathname}${location.search}`;

  const invalidMessage = useMemo(() => {
    if (!token) return "Ovom linku za pozivnicu nedostaje token.";
    if (!preview || preview.status === "valid") return "";
    return statusCopy[preview.status] ?? "Ova pozivnica ne moze da se prihvati.";
  }, [preview, token]);

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setChecking(false);
        return;
      }

      try {
        setPreview(await previewInvite(token));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ucitavanje pozivnice nije uspelo.");
      } finally {
        setChecking(false);
      }
    }

    loadInvite();
  }, [token]);

  if (!loading && !isAuthenticated && token) {
    return <Navigate to={withRedirect(routes.login, redirectHere)} replace />;
  }

  async function handleAccept() {
    setSubmitting(true);
    setError("");

    try {
      await acceptInvite(token);
      window.location.assign(routes.legacyAppHome);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prihvatanje pozivnice nije uspelo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="centered-page">
      <section className="simple-panel">
        <h1>Pozivnica za domacinstvo</h1>
        {checking || loading ? (
          <p>Proveravam tvoju pozivnicu...</p>
        ) : (
          <>
            {error && <StatusMessage type="error">{error}</StatusMessage>}
            {invalidMessage && <StatusMessage type="error">{invalidMessage}</StatusMessage>}
            {preview?.status === "valid" && (
              <>
                <StatusMessage type="info">
                  Pozvan/a si da se pridruzis domacinstvu {preview.household_name ?? "ovom domacinstvu"}.
                </StatusMessage>
                <button onClick={handleAccept} disabled={submitting}>
                  {submitting ? "Pridruzujem..." : "Prihvati pozivnicu"}
                </button>
              </>
            )}
            {preview?.status === "already_member" && <Link to={routes.household}>Otvori domacinstvo</Link>}
          </>
        )}
      </section>
    </main>
  );
}
