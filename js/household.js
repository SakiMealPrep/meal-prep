import {
  acceptInvite,
  createHousehold,
  createHouseholdInvite,
  getCurrentHousehold,
  repairMyHouseholds,
  requireSession,
} from "./supabase.js";

const householdForm = document.getElementById("householdForm");
const joinForm = document.getElementById("joinForm");
const inviteInput = document.getElementById("inviteToken");
const householdActionTitle = document.getElementById("householdActionTitle");
const householdActionText = document.getElementById("householdActionText");
const existingHouseholdActions = document.getElementById("existingHouseholdActions");
const sendInviteButton = document.getElementById("sendInviteButton");
const householdInviteLink = document.getElementById("householdInviteLink");
const params = new URLSearchParams(window.location.search);
let currentHousehold = null;

init();

async function init() {
  const user = await requireSession();
  if (!user) return;

  const existing = await getCurrentHousehold();
  const invite = params.get("invite");
  if (invite) inviteInput.value = invite;
  if (existing && !invite) {
    showExistingHousehold(existing);
    return;
  }

  if (!existing && !invite) {
    const repaired = await repairMyHouseholds().catch(() => null);
    if (repaired) {
      const household = await getCurrentHousehold().catch(() => null);
      if (household) {
        showToast("Postojeci household je povezan sa tvojim nalogom.", "success", 3500);
        showExistingHousehold(household);
      }
    }
  }
}

householdForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("householdName").value.trim();
  if (!name) return;

  try {
    await createHousehold(name);
    await migrateLocalDataNotice();
    window.location.href = "index.html";
  } catch (error) {
    showToast(error.message || "Domacinstvo nije napravljeno.", "danger", 5000);
  }
});

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = extractToken(inviteInput.value);
  if (!token) {
    showToast("Unesi invite token ili link.", "warning");
    return;
  }

  try {
    await acceptInvite(token);
    await migrateLocalDataNotice();
    window.location.href = "index.html";
  } catch (error) {
    showToast(error.message || "Pozivnica nije prihvacena.", "danger", 5000);
  }
});

sendInviteButton.addEventListener("click", async () => {
  if (!currentHousehold) return;

  try {
    const invite = await createHouseholdInvite(currentHousehold.id);
    const basePath = window.location.pathname.replace("household.html", "");
    const link = `${window.location.origin}${basePath}signup.html?invite=${invite.token}`;
    householdInviteLink.hidden = false;
    householdInviteLink.value = link;
    await navigator.clipboard?.writeText(link);
    showToast("Invite link je napravljen i kopiran.", "success", 5000);
  } catch (error) {
    showToast(error.message || "Nije moguce napraviti pozivnicu.", "danger", 5000);
  }
});

function showExistingHousehold(household) {
  currentHousehold = household;
  householdActionTitle.textContent = household.name;
  householdActionText.textContent = "Vec si vlasnik ovog domacinstva. Posalji pozivnicu za novog clana.";
  householdForm.hidden = true;
  existingHouseholdActions.hidden = false;
}

function extractToken(value) {
  const raw = value.trim();
  if (!raw) return "";
  try {
    return new URL(raw).searchParams.get("invite") || raw;
  } catch {
    return raw;
  }
}

async function migrateLocalDataNotice() {
  if (localStorage.getItem("inventory") || localStorage.getItem("weeklyPlan")) {
    showToast("Lokalni podaci ce biti ponudjeni za migraciju na relevantnim stranicama.", "info", 5000);
  }
}
