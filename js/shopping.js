import {
  addHouseholdInventoryItems,
  getHouseholdInventory,
  getMealPlan,
  getRecipes,
  normalizeKey,
  requireHousehold,
} from "./supabase.js";

const container = document.getElementById("shoppingListContainer");
const meta = document.getElementById("shoppingListMeta");
const finishShoppingButton = document.getElementById("finishShopping");
const clearBoughtButton = document.getElementById("clearBoughtItems");
const resetButton = document.getElementById("resetShoppingList");

let context = null;
let allRecipes = [];
let currentItems = [];
let currentRecipeCount = 0;
let currentUsesPlan = false;

async function initShoppingList() {
  try {
    context = await requireHousehold();
    if (!context) return;

    allRecipes = await getRecipes();
    currentItems = await buildShoppingList();
    renderList();
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="alert alert-danger">Household lista kupovine nije dostupna. Pokreni supabase/households.sql.</div>`;
  }
}

async function buildShoppingList() {
  const [plan, inventoryRows] = await Promise.all([
    getMealPlan(context.household.id),
    getHouseholdInventory(context.household.id),
  ]);
  const selectedIds = getPlanRecipeIds(plan);
  const sourceRecipes = selectedIds.length
    ? allRecipes.filter((recipe) => selectedIds.includes(recipe.id))
    : allRecipes;
  const inventory = new Set(inventoryRows.map((item) => item.ingredient_key));
  const itemsByKey = new Map();

  sourceRecipes.forEach((recipe) => {
    normalizeIngredients(recipe.ingredients).forEach((item) => {
      const key = normalizeKey(item);
      if (key && !inventory.has(key) && !itemsByKey.has(key)) {
        itemsByKey.set(key, { key, label: item });
      }
    });
  });

  currentRecipeCount = sourceRecipes.length;
  currentUsesPlan = selectedIds.length > 0;
  updateMeta(inventory.size);
  return Array.from(itemsByKey.values()).sort((a, b) => a.label.localeCompare(b.label, "sr"));
}

function renderList() {
  const bought = new Set(getBoughtItems());
  const visibleItems = currentItems.filter((item) => !bought.has(item.key));

  container.innerHTML = "";

  if (!currentItems.length) {
    container.innerHTML = `
      <div class="empty-state shopping-empty">
        <span class="material-icons">check_circle</span>
        <div>
          <strong>Imas sve sto ti treba.</strong>
          <p>Household inventar pokriva sve sastojke iz trenutnog plana.</p>
        </div>
      </div>`;
    return;
  }

  if (!visibleItems.length) {
    container.innerHTML = `
      <div class="empty-state shopping-empty">
        <span class="material-icons">done_all</span>
        <div>
          <strong>Sve sa liste je oznaceno kao kupljeno.</strong>
          <p>Klikni Zavrsena kupovina da sve predje u household inventar.</p>
        </div>
      </div>`;
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "shopping-list";

  visibleItems.forEach((item) => {
    ul.insertAdjacentHTML(
      "beforeend",
      `<li class="shopping-list-item">
        <label>
          <input class="form-check-input" type="checkbox" value="${escapeHtml(item.key)}">
          <span>${escapeHtml(item.label)}</span>
        </label>
      </li>`
    );
  });

  container.appendChild(ul);
}

function updateMeta(inventoryCount = null) {
  const source = currentUsesPlan ? "nedeljnog plana" : "svih recepata";
  const invText = inventoryCount === null ? "" : ` Na stanju: ${inventoryCount} sastojaka.`;
  meta.textContent = `${context.household.name}: lista je izracunata iz ${source}, za ${currentRecipeCount} recepta.${invText}`;
}

function markBought(key) {
  const bought = new Set(getBoughtItems());
  bought.add(key);
  localStorage.setItem("shoppingBought", JSON.stringify(Array.from(bought)));
  renderList();
}

function clearBoughtItems() {
  const bought = new Set(getBoughtItems());
  currentItems = currentItems.filter((item) => !bought.has(item.key));
  localStorage.removeItem("shoppingBought");
  renderList();
  showToast("Kupljene stavke su sklonjene sa trenutne liste.", "success");
}

async function finishShopping() {
  if (!currentItems.length) {
    showToast("Lista kupovine je vec prazna.", "info");
    return;
  }

  const bought = new Set(getBoughtItems());
  const remainingItems = currentItems.filter((item) => !bought.has(item.key));
  const itemsToStore = remainingItems.length ? remainingItems : currentItems;

  await addHouseholdInventoryItems(context.household.id, itemsToStore);
  currentItems = [];
  localStorage.removeItem("shoppingBought");
  renderList();
  showToast("Kupovina je zavrsena. Stavke su prebacene u household inventar.", "success", 4000);
}

async function resetShoppingList() {
  localStorage.removeItem("shoppingBought");
  currentItems = await buildShoppingList();
  renderList();
  showToast("Lista je osvezena iz household plana i inventara.", "info");
}

function getPlanRecipeIds(plan) {
  const ids = Object.values(plan)
    .flatMap((dayObj) => Object.values(dayObj))
    .filter(Boolean);
  return [...new Set(ids)];
}

function getBoughtItems() {
  try {
    return JSON.parse(localStorage.getItem("shoppingBought")) || [];
  } catch {
    return [];
  }
}

function normalizeIngredients(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

container.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".shopping-list-item input");
  if (!checkbox) return;
  markBought(checkbox.value);
});

clearBoughtButton?.addEventListener("click", clearBoughtItems);
finishShoppingButton?.addEventListener("click", finishShopping);
resetButton?.addEventListener("click", resetShoppingList);

initShoppingList();
