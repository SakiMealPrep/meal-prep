import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { StatusMessage } from "../components/StatusMessage";
import { sendPasswordReset } from "../lib/auth";
import { routes } from "../lib/routes";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await sendPasswordReset(email);
      navigate(`${routes.checkEmail}?mode=reset&email=${encodeURIComponent(email)}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Slanje emaila za reset nije uspelo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Resetuj lozinku" subtitle="Poslacemo ti siguran link za oporavak lozinke na email.">
      {error && <StatusMessage type="error">{error}</StatusMessage>}
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Saljem..." : "Posalji link za reset"}
        </button>
      </form>
      <div className="auth-links">
        <Link to={routes.login}>Nazad na prijavu</Link>
      </div>
    </AuthLayout>
  );
}
