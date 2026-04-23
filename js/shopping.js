import { getRecipes } from "./supabase.js";

const container = document.getElementById("shoppingListContainer");
const meta = document.getElementById("shoppingListMeta");
const clearBoughtButton = document.getElementById("clearBoughtItems");
const resetButton = document.getElementById("resetShoppingList");

let allRecipes = [];
let currentItems = [];
let currentRecipeCount = 0;
let currentUsesPlan = false;

async function initShoppingList() {
  try {
    allRecipes = await getRecipes();
    currentItems = buildShoppingList(allRecipes);
    renderList();
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="alert alert-danger">Supabase tabela recipes nije dostupna.</div>`;
  }
}

function buildShoppingList(recipes) {
  const selectedIds = getPlanRecipeIds();
  const sourceRecipes = selectedIds.length
    ? recipes.filter((recipe) => selectedIds.includes(recipe.id))
    : recipes;
  const inventory = new Set(getInventory());
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
  updateMeta();
  return Array.from(itemsByKey.values()).sort((a, b) => a.label.localeCompare(b.label, "sr"));
}

function renderList() {
  const bought = new Set(getBoughtItems());
  const visibleItems = currentItems.filter((item) => !bought.has(item.key));

  updateMeta();
  container.innerHTML = "";

  if (!currentItems.length) {
    container.innerHTML = `
      <div class="empty-state shopping-empty">
        <span class="material-icons">check_circle</span>
        <div>
          <strong>Imas sve sto ti treba.</strong>
          <p>Inventar pokriva sve sastojke iz trenutnog plana.</p>
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
          <p>Osvezi listu ako zelis ponovo da je izracunas iz inventara.</p>
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

function updateMeta() {
  const inventoryCount = getInventory().length;
  const source = currentUsesPlan ? "nedeljnog plana" : "svih recepata";
  meta.textContent = `Lista je izracunata iz ${source}, za ${currentRecipeCount} recepta. Na stanju: ${inventoryCount} sastojaka.`;
}

function markBought(key) {
  const bought = new Set(getBoughtItems());
  bought.add(key);
  localStorage.setItem("shoppingBought", JSON.stringify(Array.from(bought)));
  addInventoryItem(key);
  renderList();
}

function clearBoughtItems() {
  const bought = new Set(getBoughtItems());
  currentItems = currentItems.filter((item) => !bought.has(item.key));
  localStorage.removeItem("shoppingBought");
  renderList();
  showToast("Kupljene stavke su sklonjene.", "success");
}

function resetShoppingList() {
  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingBought");
  currentItems = buildShoppingList(allRecipes);
  renderList();
  showToast("Lista je osvezena iz plana i inventara.", "info");
}

function getPlanRecipeIds() {
  const plan = getSavedPlan();
  const ids = Object.values(plan)
    .flatMap((dayObj) => Object.values(dayObj))
    .filter(Boolean);
  return [...new Set(ids)];
}

function getSavedPlan() {
  const raw = localStorage.getItem("weeklyPlan");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getInventory() {
  try {
    return (JSON.parse(localStorage.getItem("inventory")) || []).map(normalizeKey);
  } catch {
    return [];
  }
}

function addInventoryItem(key) {
  const inventory = new Set(getInventory());
  inventory.add(key);
  localStorage.setItem("inventory", JSON.stringify(Array.from(inventory).sort()));
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

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "dj");
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
resetButton?.addEventListener("click", resetShoppingList);

initShoppingList();
