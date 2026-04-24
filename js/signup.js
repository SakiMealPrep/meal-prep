import { acceptInvite, getCurrentHousehold, signUp } from "./supabase.js";

const params = new URLSearchParams(window.location.search);
const invite = params.get("invite");
const form = document.getElementById("signupForm");
const loginLink = document.getElementById("loginLink");
const subtitle = document.getElementById("signupSubtitle");

if (invite) {
  loginLink.href = `login.html?invite=${encodeURIComponent(invite)}`;
  subtitle.textContent = "Registruj se i automatski se pridruzi domacinstvu iz pozivnice.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("button");
  submit.disabled = true;

  try {
    await signUp(form.email.value.trim(), form.password.value);
    if (invite) {
      try {
        await acceptInvite(invite);
        window.location.href = "index.html";
        return;
      } catch {
        window.location.href = `household.html?invite=${encodeURIComponent(invite)}`;
        return;
      }
    }

    const household = await getCurrentHousehold();
    window.location.href = household ? "index.html" : "household.html";
  } catch (error) {
    showToast(error.message || "Registracija nije uspela.", "danger", 5000);
  } finally {
    submit.disabled = false;
  }
});
