import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../contexts/AuthContext";
import { createHousehold, createInvite, Household, listHouseholds } from "../lib/households";
import { routes } from "../lib/routes";
import { signOut } from "../lib/auth";

export function HouseholdPage() {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingHousehold, setSubmittingHousehold] = useState(false);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeHousehold = useMemo(
    () => households.find((household) => household.id === activeHouseholdId) ?? households[0] ?? null,
    [activeHouseholdId, households],
  );

  useEffect(() => {
    loadHouseholds();
  }, []);

  async function loadHouseholds() {
    setLoading(true);
    setError("");

    try {
      const rows = await listHouseholds();
      setHouseholds(rows);
      setActiveHouseholdId((current) => current || rows[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load households.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateHousehold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingHousehold(true);
    setError("");
    setMessage("");

    try {
      const householdId = await createHousehold(householdName);
      setHouseholdName("");
      setActiveHouseholdId(householdId);
      setMessage("Household created.");
      await loadHouseholds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create household.");
    } finally {
      setSubmittingHousehold(false);
    }
  }

  async function handleCreateInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeHousehold) return;

    setSubmittingInvite(true);
    setError("");
    setMessage("");
    setInviteLink("");

    try {
      const invite = await createInvite(activeHousehold.id, inviteEmail);
      const link = new URL(routes.acceptInvite, window.location.origin);
      link.searchParams.set("token", invite.token);
      setInviteLink(link.toString());
      setInviteEmail("");
      setMessage(`Invite created. It expires on ${new Date(invite.expiresAt).toLocaleDateString()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create invite.");
    } finally {
      setSubmittingInvite(false);
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <Link className="brand-link" to={routes.home}>
            Smart Meal Planner
          </Link>
          <p>{user?.email}</p>
        </div>
        <button className="secondary-button" onClick={handleSignOut}>
          Sign out
        </button>
      </header>

      <section className="page-heading">
        <h1>Household</h1>
        <p>Create a shared household and invite members by email.</p>
      </section>

      {loading && <StatusMessage type="info">Loading household data...</StatusMessage>}
      {message && <StatusMessage type="success">{message}</StatusMessage>}
      {error && <StatusMessage type="error">{error}</StatusMessage>}

      <section className="grid-two">
        <article className="panel">
          <h2>Create household</h2>
          <form onSubmit={handleCreateHousehold} className="form-stack">
            <label>
              Household name
              <input
                value={householdName}
                onChange={(event) => setHouseholdName(event.target.value)}
                placeholder="Family kitchen"
                required
              />
            </label>
            <button type="submit" disabled={submittingHousehold}>
              {submittingHousehold ? "Creating..." : "Create household"}
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Invite member</h2>
          {households.length > 0 ? (
            <form onSubmit={handleCreateInvite} className="form-stack">
              <label>
                Household
                <select value={activeHousehold?.id ?? ""} onChange={(event) => setActiveHouseholdId(event.target.value)}>
                  {households.map((household) => (
                    <option key={household.id} value={household.id}>
                      {household.name} ({household.role})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Invite email
                <input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  type="email"
                  placeholder="member@example.com"
                  required
                />
              </label>
              <button type="submit" disabled={submittingInvite}>
                {submittingInvite ? "Creating invite..." : "Create invite link"}
              </button>
            </form>
          ) : (
            <p>Create a household first, then you can invite members.</p>
          )}
          {inviteLink && (
            <label className="copy-field">
              Invite link
              <input value={inviteLink} readOnly onFocus={(event) => event.target.select()} />
            </label>
          )}
        </article>
      </section>

      <section className="panel">
        <h2>Your households</h2>
        {households.length ? (
          <ul className="household-list">
            {households.map((household) => (
              <li key={household.id}>
                <strong>{household.name}</strong>
                <span>{household.role}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No households yet.</p>
        )}
      </section>
    </main>
  );
}
