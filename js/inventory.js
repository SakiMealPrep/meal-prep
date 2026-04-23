import { getRecipes } from "./supabase.js";

const inventoryList = document.getElementById("inventoryList");
const inventorySearch = document.getElementById("inventorySearch");
const inventorySummary = document.getElementById("inventorySummary");
const selectAllButton = document.getElementById("selectAllInventory");

let allIngredients = [];

async function initInventory() {
  try {
    const recipes = await getRecipes();
    allIngredients = uniqueIngredients(recipes.flatMap((recipe) => normalizeIngredients(recipe.ingredients)));
    renderInventory();
  } catch (error) {
    console.error(error);
    inventoryList.innerHTML = `<div class="alert alert-danger">Supabase tabela recipes nije dostupna.</div>`;
  }
}

function renderInventory() {
  const saved = getInventory();
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

function saveInventory({ quiet = false } = {}) {
  const selected = Array.from(document.querySelectorAll("#inventoryList .form-check-input"))
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => normalizeKey(checkbox.value));

  const merged = new Set(getInventory());
  const visibleKeys = new Set(
    Array.from(document.querySelectorAll("#inventoryList .form-check-input")).map((checkbox) => normalizeKey(checkbox.value))
  );

  visibleKeys.forEach((key) => merged.delete(key));
  selected.forEach((key) => merged.add(key));

  localStorage.setItem("inventory", JSON.stringify(Array.from(merged).sort()));
  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingBought");
  updateSummary();

  if (!quiet) showToast("Inventar sacuvan. Lista kupovine ce se preracunati.", "success");
}

function clearInventory() {
  localStorage.removeItem("inventory");
  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingBought");
  renderInventory();
  showToast("Inventar je ociscen.", "info");
}

function selectVisibleIngredients() {
  document.querySelectorAll("#inventoryList .form-check-input").forEach((checkbox) => {
    checkbox.checked = true;
  });
  saveInventory();
}

function updateSummary() {
  const count = getInventory().length;
  const total = allIngredients.length;
  inventorySummary.textContent = count
    ? `Na stanju je ${count} od ${total} sastojaka.`
    : `Nista nije oznaceno. Lista kupovine ce prikazati sve potrebne sastojke.`;
}

function getInventory() {
  const raw = localStorage.getItem("inventory");
  if (!raw) return [];
  try {
    return JSON.parse(raw).map(normalizeKey);
  } catch {
    return [];
  }
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

inventoryList.addEventListener("change", () => saveInventory());
inventorySearch?.addEventListener("input", renderInventory);
selectAllButton?.addEventListener("click", selectVisibleIngredients);
window.clearInventory = clearInventory;

initInventory();
