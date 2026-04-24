import { supabase } from "./supabase";
import { absoluteUrl, routes } from "./routes";

function getSiteUrl() {
  return (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() || window.location.origin;
}

export async function signUpWithEmail(email: string, password: string, redirectTo?: string) {
  const emailRedirectTo = new URL(
    `${routes.authCallback}?redirectTo=${encodeURIComponent(redirectTo ?? routes.household)}`,
    getSiteUrl(),
  );

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: emailRedirectTo.toString() },
  });

  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function resendConfirmationEmail(email: string, redirectTo?: string) {
  const emailRedirectTo = new URL(
    `${routes.authCallback}?redirectTo=${encodeURIComponent(redirectTo ?? routes.household)}`,
    getSiteUrl(),
  );

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: emailRedirectTo.toString() },
  });

  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL(routes.resetPassword, getSiteUrl()).toString(),
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
