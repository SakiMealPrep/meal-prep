import { getCurrentHousehold, getCurrentUser, signOut } from "./supabase.js";

const subtitle = document.getElementById("dashboardSubtitle");
const logoutButton = document.getElementById("dashboardLogout");

logoutButton?.addEventListener("click", async () => {
  await signOut();
  localStorage.removeItem("activeHouseholdId");
  window.location.href = "login.html";
});

initDashboard();

async function initDashboard() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      window.location.href = "login.html?next=app.html";
      return;
    }

    const household = await getCurrentHousehold();
    if (!household) {
      window.location.href = "household.html";
      return;
    }

    subtitle.textContent = `${household.name} • ${user.email}`;
  } catch (error) {
    console.error(error);
    subtitle.textContent = "Nismo uspeli da ucitamo planner. Proveri household i prijavu.";
  }
}
