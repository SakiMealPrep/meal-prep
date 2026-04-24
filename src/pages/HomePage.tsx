import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { routes } from "../lib/routes";

export function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <main className="home-page">
      <section className="home-hero">
        <p className="eyebrow">Smart Meal Planner</p>
        <h1>Plan meals with everyone in your household.</h1>
        <p>Use Supabase Auth, secure household membership, and invite links that work for new and existing users.</p>
        <div className="button-row">
          {!loading && isAuthenticated ? (
            <a className="button-link" href={routes.legacyAppHome}>
              Open planner
            </a>
          ) : (
            <>
              <Link className="button-link" to={routes.login}>
                Sign in
              </Link>
              <Link className="button-link secondary" to={routes.signup}>
                Create account
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
