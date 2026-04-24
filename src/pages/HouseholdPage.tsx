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
  const hasHousehold = households.length > 0;
  const canInvite = activeHousehold?.role === "owner" || activeHousehold?.role === "admin";

  function formatRole(role?: Household["role"]) {
    if (role === "owner") return "vlasnik";
    if (role === "admin") return "administrator";
    if (role === "member") return "clan";
    return "";
  }

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
      setError(err instanceof Error ? err.message : "Ucitavanje domacinstava nije uspelo.");
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
      setMessage("Domacinstvo je napravljeno.");
      await loadHouseholds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pravljenje domacinstva nije uspelo.");
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
      setMessage(`Pozivnica je napravljena. Istice ${new Date(invite.expiresAt).toLocaleDateString()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pravljenje pozivnice nije uspelo.");
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
          Odjavi se
        </button>
      </header>

      <section className="page-heading">
        <h1>Domacinstvo</h1>
        <p>
          {hasHousehold
            ? "Upravljaj svojim domacinstvom i deli pozivnice sa ljudima koji planiraju obroke zajedno sa tobom."
            : "Napravi zajednicko domacinstvo i pozovi clanove putem emaila."}
        </p>
      </section>

      {loading && <StatusMessage type="info">Ucitavam podatke o domacinstvu...</StatusMessage>}
      {message && <StatusMessage type="success">{message}</StatusMessage>}
      {error && <StatusMessage type="error">{error}</StatusMessage>}

      <section className="grid-two">
        <article className="panel">
          {hasHousehold ? (
            <>
              <h2>Tvoje domacinstvo</h2>
              <div className="household-summary">
                <div>
                  <span className="summary-label">Aktivno domacinstvo</span>
                  <strong>{activeHousehold?.name}</strong>
                </div>
                <div>
                  <span className="summary-label">Tvoja uloga</span>
                  <strong>{formatRole(activeHousehold?.role)}</strong>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2>Napravi domacinstvo</h2>
              <form onSubmit={handleCreateHousehold} className="form-stack">
                <label>
                  Naziv domacinstva
                  <input
                    value={householdName}
                    onChange={(event) => setHouseholdName(event.target.value)}
                    placeholder="Porodicna kuhinja"
                    required
                  />
                </label>
                <button type="submit" disabled={submittingHousehold}>
                  {submittingHousehold ? "Pravim..." : "Napravi domacinstvo"}
                </button>
              </form>
            </>
          )}
        </article>

        <article className="panel">
          <h2>Pozovi clana</h2>
          {hasHousehold && canInvite ? (
            <form onSubmit={handleCreateInvite} className="form-stack">
              <label>
                Domacinstvo
                <select value={activeHousehold?.id ?? ""} onChange={(event) => setActiveHouseholdId(event.target.value)}>
                  {households.map((household) => (
                    <option key={household.id} value={household.id}>
                      {household.name} ({formatRole(household.role)})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Email za poziv
                <input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  type="email"
                  placeholder="clan@example.com"
                  required
                />
              </label>
              <button type="submit" disabled={submittingInvite}>
                {submittingInvite ? "Pravim pozivnicu..." : "Napravi link za pozivnicu"}
              </button>
            </form>
          ) : hasHousehold ? (
            <p>Samo vlasnici i administratori domacinstva mogu da prave pozivnice.</p>
          ) : (
            <p>Prvo napravi domacinstvo, pa ces onda moci da pozivas clanove.</p>
          )}
          {inviteLink && (
            <label className="copy-field">
              Link za pozivnicu
              <input value={inviteLink} readOnly onFocus={(event) => event.target.select()} />
            </label>
          )}
        </article>
      </section>

      <section className="panel">
        <h2>Tvoja domacinstva</h2>
        {households.length ? (
          <ul className="household-list">
            {households.map((household) => (
              <li key={household.id}>
                <strong>{household.name}</strong>
                <span>{formatRole(household.role)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Jos nema domacinstava.</p>
        )}
      </section>
    </main>
  );
}
