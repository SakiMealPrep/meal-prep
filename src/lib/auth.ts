import { getSupabaseClient } from "./supabase";
import { routes } from "./routes";

function getSiteUrl() {
  return (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() || window.location.origin;
}

export async function signUpWithEmail(email: string, password: string, redirectTo?: string) {
  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function resendConfirmationEmail(email: string, redirectTo?: string) {
  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL(routes.resetPassword, getSiteUrl()).toString(),
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
