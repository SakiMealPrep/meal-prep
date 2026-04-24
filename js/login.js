import { getCurrentHousehold, signIn } from "./supabase.js";

const params = new URLSearchParams(window.location.search);
const next = params.get("next") || "app.html";
const invite = params.get("invite");
const form = document.getElementById("loginForm");
const signupLink = document.getElementById("signupLink");

if (invite) signupLink.href = `signup.html?invite=${encodeURIComponent(invite)}`;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("button");
  submit.disabled = true;

  try {
    await signIn(form.email.value.trim(), form.password.value);
    if (invite) {
      window.location.href = `household.html?invite=${encodeURIComponent(invite)}`;
      return;
    }
    const household = await getCurrentHousehold();
    window.location.href = household ? next : "household.html";
  } catch (error) {
    showToast(error.message || "Prijava nije uspela.", "danger", 5000);
  } finally {
    submit.disabled = false;
  }
});
