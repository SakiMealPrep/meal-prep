import { Link } from "react-router-dom";
import type React from "react";
import { routes } from "../lib/routes";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="brand-link" to={routes.home}>
          Smart Meal Planner
        </Link>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
