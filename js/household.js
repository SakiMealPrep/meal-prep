import { acceptInvite, createHousehold, getCurrentHousehold, repairMyHouseholds, requireSession } from "./supabase.js";

const householdForm = document.getElementById("householdForm");
const joinForm = document.getElementById("joinForm");
const inviteInput = document.getElementById("inviteToken");
const params = new URLSearchParams(window.location.search);

init();

async function init() {
  const user = await requireSession();
  if (!user) return;

  const existing = await getCurrentHousehold();
  const invite = params.get("invite");
  if (invite) inviteInput.value = invite;
  if (existing && !invite) window.location.href = "index.html";

  if (!existing && !invite) {
    const repaired = await repairMyHouseholds().catch(() => null);
    if (repaired) {
      showToast("Postojeci household je povezan sa tvojim nalogom.", "success", 3500);
      setTimeout(() => (window.location.href = "index.html"), 800);
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
    showToast(error.message || "Household nije napravljen.", "danger", 5000);
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
