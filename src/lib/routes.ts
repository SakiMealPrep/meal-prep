export const routes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  checkEmail: "/auth/check-email",
  resetPassword: "/reset-password",
  authCallback: "/auth/callback",
  acceptInvite: "/invite/accept",
  household: "/household",
};

export function absoluteUrl(path: string) {
  return new URL(path, window.location.origin).toString();
}

export function withRedirect(path: string, redirectTo: string) {
  const params = new URLSearchParams({ redirectTo });
  return `${path}?${params.toString()}`;
}

export function getRedirectTo(search: string, fallback = routes.household) {
  const redirectTo = new URLSearchParams(search).get("redirectTo");
  if (!redirectTo || !redirectTo.startsWith("/")) return fallback;
  return redirectTo;
}
