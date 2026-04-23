const clearLocalDataButton = document.getElementById("clearLocalData");
const installAppButton = document.getElementById("installApp");
let installPromptEvent = null;

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
