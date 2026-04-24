import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../contexts/AuthContext";
import { acceptInvite, InvitePreview, previewInvite } from "../lib/households";
import { routes, withRedirect } from "../lib/routes";

const statusCopy: Record<string, string> = {
  invalid: "This invite link is invalid.",
  expired: "This invite has expired. Ask for a new invite.",
  used: "This invite has already been used.",
  already_member: "You are already a member of this household.",
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
    if (!token) return "This invite link is missing a token.";
    if (!preview || preview.status === "valid") return "";
    return statusCopy[preview.status] ?? "This invite cannot be accepted.";
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
        setError(err instanceof Error ? err.message : "Unable to load invite.");
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
      navigate(routes.household, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept invite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="centered-page">
      <section className="simple-panel">
        <h1>Household invite</h1>
        {checking || loading ? (
          <p>Checking your invite...</p>
        ) : (
          <>
            {error && <StatusMessage type="error">{error}</StatusMessage>}
            {invalidMessage && <StatusMessage type="error">{invalidMessage}</StatusMessage>}
            {preview?.status === "valid" && (
              <>
                <StatusMessage type="info">
                  You have been invited to join {preview.household_name ?? "this household"}.
                </StatusMessage>
                <button onClick={handleAccept} disabled={submitting}>
                  {submitting ? "Joining..." : "Accept invite"}
                </button>
              </>
            )}
            {preview?.status === "already_member" && <Link to={routes.household}>Open household</Link>}
          </>
        )}
      </section>
    </main>
  );
}
