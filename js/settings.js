import {
  createHouseholdInvite,
  getCurrentHousehold,
  getCurrentUser,
  listHouseholdMembers,
  signOut,
} from "./supabase.js";

const clearLocalDataButton = document.getElementById("clearLocalData");
const installAppButton = document.getElementById("installApp");
const householdStatus = document.getElementById("householdStatus");
const inviteMemberButton = document.getElementById("inviteMember");
const inviteLinkInput = document.getElementById("inviteLink");
const logoutButton = document.getElementById("logoutButton");
let installPromptEvent = null;
let accountAction = "invite";

initAccountPanel();

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPromptEvent = event;
  if (installAppButton) installAppButton.disabled = false;
});

installAppButton?.addEventListener("click", async () => {
  if (!installPromptEvent) {
    showToast("Ako dugme nije dostupno, otvori browser meni i izaberi Add to Home Screen.", "info", 5000);
    return;
  }

  installPromptEvent.prompt();
  await installPromptEvent.userChoice;
  installPromptEvent = null;
});

clearLocalDataButton?.addEventListener("click", () => {
  if (!confirm("Obrisati inventar, nedeljni plan i listu kupovine iz ovog browsera?")) return;

  localStorage.removeItem("inventory");
  localStorage.removeItem("weeklyPlan");
  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingBought");
  showToast("Lokalni podaci su obrisani.", "success");
});

inviteMemberButton?.addEventListener("click", async () => {
  if (accountAction === "login") {
    window.location.href = "login.html";
    return;
  }

  if (accountAction === "create-household") {
    window.location.href = "household.html";
    return;
  }

  try {
    const household = await getCurrentHousehold();
    if (!household) {
      window.location.href = "household.html";
      return;
    }

    const invite = await createHouseholdInvite(household.id);
    const link = `${window.location.origin}${window.location.pathname.replace("settings.html", "")}signup.html?invite=${invite.token}`;
    inviteLinkInput.hidden = false;
    inviteLinkInput.value = link;
    await navigator.clipboard?.writeText(link);
    showToast("Invite link je napravljen i kopiran.", "success", 5000);
  } catch (error) {
    showToast(error.message || "Nije moguce napraviti pozivnicu.", "danger", 5000);
  }
});

logoutButton?.addEventListener("click", async () => {
  await signOut();
  localStorage.removeItem("activeHouseholdId");
  window.location.href = "login.html";
});

async function initAccountPanel() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      householdStatus.textContent = "Nisi ulogovan/a. Prijavi se da koristis household funkcije.";
      inviteMemberButton.textContent = "Prijavi se";
      accountAction = "login";
      logoutButton.hidden = true;
      return;
    }

    const household = await getCurrentHousehold();
    if (!household) {
      householdStatus.textContent = `Ulogovan/a kao ${user.email}. Jos nemas household.`;
      inviteMemberButton.textContent = "Napravi household";
      accountAction = "create-household";
      return;
    }

    const members = await listHouseholdMembers(household.id);
    householdStatus.textContent = `${household.name} • ${members.length} clan(a) • ${user.email}`;
    accountAction = "invite";
  } catch (error) {
    householdStatus.textContent = "Household status nije dostupan. Proveri Supabase schema.";
    console.error(error);
  }
}
