import { getRecipes } from "./supabase.js";

const inventoryList = document.getElementById("inventoryList");

async function initInventory() {
  try {
    const recipes = await getRecipes();
    const ingredients = [
      ...new Set(recipes.flatMap((recipe) => normalizeIngredients(recipe.ingredients))),
    ].sort((a, b) => a.localeCompare(b, "sr"));

    renderInventory(ingredients);
  } catch (error) {
    console.error(error);
    inventoryList.innerHTML = `<div class="alert alert-danger">Supabase tabela recipes nije dostupna.</div>`;
  }
}

function renderInventory(ingredients) {
  const saved = getInventory();
  inventoryList.innerHTML = "";

  ingredients.forEach((item) => {
    const id = item.toLowerCase().replace(/\s+/g, "-");
    const div = document.createElement("div");
    div.className = "col-md-4 mb-2";
    div.innerHTML = `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${escapeHtml(item)}" id="${escapeHtml(id)}" ${
      saved.includes(normalizeName(item)) ? "checked" : ""
    }>
        <label class="form-check-label" for="${escapeHtml(id)}">${escapeHtml(item)}</label>
      </div>
    `;
    inventoryList.appendChild(div);
  });
}

function saveInventory() {
  const selected = Array.from(document.querySelectorAll("#inventoryList .form-check-input"))
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => normalizeName(checkbox.value));

  localStorage.setItem("inventory", JSON.stringify(selected));
  showToast("Inventar sacuvan!", "success");
}

function clearInventory() {
  localStorage.removeItem("inventory");
  initInventory();
  showToast("Inventar je ociscen.", "info");
}

function getInventory() {
  const raw = localStorage.getItem("inventory");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
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

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

inventoryList.addEventListener("change", saveInventory);
window.clearInventory = clearInventory;

initInventory();
