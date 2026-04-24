import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { routes } from "../lib/routes";

export function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <main className="home-page">
      <section className="home-hero">
        <p className="eyebrow">Smart Meal Planner</p>
        <h1>Planiraj obroke zajedno sa svim clanovima svog domacinstva.</h1>
        <p>Koristi sigurnu prijavu, zajednicko domacinstvo i pozivnice koje rade i za nove i za postojece korisnike.</p>
        <div className="button-row">
          {!loading && isAuthenticated ? (
            <a className="button-link" href={routes.legacyAppHome}>
              Otvori planner
            </a>
          ) : (
            <>
              <Link className="button-link" to={routes.login}>
                Prijavi se
              </Link>
              <Link className="button-link secondary" to={routes.signup}>
                Napravi nalog
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
