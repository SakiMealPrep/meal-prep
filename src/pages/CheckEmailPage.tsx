import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { routes } from "../lib/routes";

const copy = {
  signup: {
    title: "Proveri svoje sanduce",
    subtitle: "Poslali smo ti link za potvrdu kako bi zavrsio/la pravljenje naloga.",
    hint: "Otvori email na ovom uredjaju i dodirni dugme za potvrdu da bi nastavio/la.",
  },
  reset: {
    title: "Link za reset je poslat",
    subtitle: "Poslali smo ti siguran link za reset lozinke.",
    hint: "Otvori email i nastavi u istom browseru kako bismo mogli da potvrdimo recovery sesiju.",
  },
} as const;

export function CheckEmailPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "reset" ? "reset" : "signup";
  const email = searchParams.get("email") ?? "";
  const currentCopy = copy[mode];

  return (
    <AuthLayout title={currentCopy.title} subtitle={currentCopy.subtitle}>
      <div className="status-message status-info">
        {email ? <>Poslali smo link na adresu <strong>{email}</strong>.</> : currentCopy.hint}
      </div>
      <p className="muted-copy">{currentCopy.hint}</p>
      <div className="auth-links">
        <Link to={routes.login}>Nazad na prijavu</Link>
        {mode === "reset" ? <Link to={routes.forgotPassword}>Posalji novi reset link</Link> : <Link to={routes.signup}>Upotrebi drugu email adresu</Link>}
      </div>
    </AuthLayout>
  );
}
