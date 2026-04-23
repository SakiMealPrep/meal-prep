import {
  getHouseholdInventory,
  getRecipes,
  normalizeKey,
  requireHousehold,
  setHouseholdInventory,
} from "./supabase.js";

const inventoryList = document.getElementById("inventoryList");
const inventorySearch = document.getElementById("inventorySearch");
const inventorySummary = document.getElementById("inventorySummary");
const selectAllButton = document.getElementById("selectAllInventory");

let context = null;
let allIngredients = [];
let inventoryItems = [];

async function initInventory() {
  try {
    context = await requireHousehold();
    if (!context) return;

    const [recipes, remoteInventory] = await Promise.all([
      getRecipes(),
      getHouseholdInventory(context.household.id),
    ]);

    allIngredients = uniqueIngredients(recipes.flatMap((recipe) => normalizeIngredients(recipe.ingredients)));
    inventoryItems = remoteInventory.map((item) => ({ key: item.ingredient_key, label: item.label }));
    await migrateLocalInventory();
    renderInventory();
  } catch (error) {
    console.error(error);
    inventoryList.innerHTML = `<div class="alert alert-danger">Household inventar nije dostupan. Pokreni supabase/households.sql.</div>`;
  }
}

function renderInventory() {
  const saved = getInventoryKeys();
  const query = normalizeKey(inventorySearch?.value || "");
  const visibleIngredients = allIngredients.filter((item) => normalizeKey(item).includes(query));

  inventoryList.innerHTML = "";

  if (!visibleIngredients.length) {
    inventoryList.innerHTML = `<div class="col-12"><div class="alert alert-warning">Nema sastojaka za ovu pretragu.</div></div>`;
    updateSummary();
    return;
  }

  visibleIngredients.forEach((item) => {
    const key = normalizeKey(item);
    const id = `inventory-${key.replace(/[^a-z0-9]+/g, "-")}`;
    const div = document.createElement("div");
    div.className = "col-sm-6 col-lg-4 mb-2";
    div.innerHTML = `
      <label class="inventory-item" for="${escapeHtml(id)}">
        <input class="form-check-input" type="checkbox" value="${escapeHtml(item)}" id="${escapeHtml(id)}" ${
      saved.includes(key) ? "checked" : ""
    }>
        <span>${escapeHtml(item)}</span>
      </label>
    `;
    inventoryList.appendChild(div);
  });

  updateSummary();
}

async function saveInventory({ quiet = false } = {}) {
  const selected = Array.from(document.querySelectorAll("#inventoryList .form-check-input"))
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => ({ key: normalizeKey(checkbox.value), label: checkbox.value }));

  const merged = new Map(inventoryItems.map((item) => [item.key, item]));
  const visibleKeys = new Set(
    Array.from(document.querySelectorAll("#inventoryList .form-check-input")).map((checkbox) => normalizeKey(checkbox.value))
  );

  visibleKeys.forEach((key) => merged.delete(key));
  selected.forEach((item) => merged.set(item.key, item));

  inventoryItems = Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label, "sr"));
  await setHouseholdInventory(context.household.id, inventoryItems);
  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingBought");
  updateSummary();

  if (!quiet) showToast("Inventar sacuvan za household.", "success");
}

async function clearInventory() {
  inventoryItems = [];
  await setHouseholdInventory(context.household.id, []);
  localStorage.removeItem("inventory");
  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingBought");
  renderInventory();
  showToast("Inventar je ociscen za household.", "info");
}

async function selectVisibleIngredients() {
  document.querySelectorAll("#inventoryList .form-check-input").forEach((checkbox) => {
    checkbox.checked = true;
  });
  await saveInventory();
}

function updateSummary() {
  const count = inventoryItems.length;
  const total = allIngredients.length;
  inventorySummary.textContent = count
    ? `${context.household.name}: na stanju je ${count} od ${total} sastojaka.`
    : `${context.household.name}: nista nije oznaceno. Lista kupovine ce prikazati sve potrebne sastojke.`;
}

async function migrateLocalInventory() {
  const raw = localStorage.getItem("inventory");
  if (!raw || inventoryItems.length) return;

  try {
    const localKeys = JSON.parse(raw).map(normalizeKey);
    if (!localKeys.length) return;

    const labelsByKey = new Map(allIngredients.map((item) => [normalizeKey(item), item]));
    inventoryItems = localKeys.map((key) => ({ key, label: labelsByKey.get(key) || key }));
    await setHouseholdInventory(context.household.id, inventoryItems);
    localStorage.removeItem("inventory");
    showToast("Lokalni inventar je prebacen u household.", "success", 5000);
  } catch {
    // Ignore broken legacy localStorage.
  }
}

function getInventoryKeys() {
  return inventoryItems.map((item) => item.key);
}

function uniqueIngredients(items) {
  const byKey = new Map();
  items.forEach((item) => {
    const key = normalizeKey(item);
    if (key && !byKey.has(key)) byKey.set(key, String(item).trim());
  });
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, "sr"));
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

inventoryList.addEventListener("change", () => saveInventory());
inventorySearch?.addEventListener("input", renderInventory);
selectAllButton?.addEventListener("click", selectVisibleIngredients);
window.clearInventory = clearInventory;

initInventory();
