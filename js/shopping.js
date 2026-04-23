import { getRecipes } from "./supabase.js";

const container = document.getElementById("shoppingListContainer");

async function initShoppingList() {
  try {
    const recipes = await getRecipes();
    const savedList = getSavedShoppingList();
    const items = savedList.length ? savedList : buildListFromAllRecipes(recipes);
    renderList(items);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="alert alert-danger">Supabase tabela recipes nije dostupna.</div>`;
  }
}

function buildListFromAllRecipes(recipes) {
  const inventory = getInventory();
  const needed = new Set();

  recipes.forEach((recipe) => {
    normalizeIngredients(recipe.ingredients).forEach((item) => {
      if (!inventory.includes(normalizeName(item))) needed.add(item);
    });
  });

  return Array.from(needed).sort((a, b) => a.localeCompare(b, "sr"));
}

function renderList(items) {
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = '<p class="text-muted">Imas sve sto ti treba.</p>';
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "list-group";
  items.forEach((item) => {
    ul.insertAdjacentHTML("beforeend", `<li class="list-group-item">${escapeHtml(item)}</li>`);
  });
  container.appendChild(ul);
}

function getSavedShoppingList() {
  const raw = localStorage.getItem("shoppingList");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getInventory() {
  try {
    return JSON.parse(localStorage.getItem("inventory")) || [];
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

initShoppingList();
