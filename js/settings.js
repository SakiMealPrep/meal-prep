const clearLocalDataButton = document.getElementById("clearLocalData");

clearLocalDataButton?.addEventListener("click", () => {
  if (!confirm("Obrisati inventar, nedeljni plan i listu kupovine iz ovog browsera?")) return;

  localStorage.removeItem("inventory");
  localStorage.removeItem("weeklyPlan");
  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingBought");
  showToast("Lokalni podaci su obrisani.", "success");
});
