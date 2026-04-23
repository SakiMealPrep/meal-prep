import { deleteRecipeById, getRecipes } from "./supabase.js";

const recipeList = document.getElementById("recipeList");
const mealFilter = document.getElementById("mealFilter") || document.getElementById("categoryFilter");
const goalFilter = document.getElementById("goalFilter");
const searchInput = document.getElementById("searchInput") || document.getElementById("searchRecipe");
const filterByInventory = document.getElementById("filterByInventory");

let allRecipes = [];

async function fetchRecipes() {
  try {
    recipeList.innerHTML = `<div class="col-12"><div class="alert alert-info">Ucitavam recepte...</div></div>`;
    allRecipes = await getRecipes();
    renderRecipes();
  } catch (error) {
    recipeList.innerHTML = `<div class="col-12"><div class="alert alert-danger">Supabase tabela recipes nije dostupna. Pokreni SQL iz supabase/schema.sql.</div></div>`;
    console.error(error);
  }
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

function normalizeName(name) {
  return name ? name.trim().toLowerCase() : "";
}

function normalizeKey(name) {
  return normalizeName(name)
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/ž/g, "z")
    .replace(/š/g, "s")
    .replace(/đ/g, "dj");
}

function renderRecipes() {
  recipeList.innerHTML = "";

  const selectedMeal = mealFilter ? normalizeKey(mealFilter.value) : "";
  const selectedGoal = goalFilter ? normalizeKey(goalFilter.value) : "";
  const query = searchInput ? normalizeName(searchInput.value) : "";
  const inventory = getInventory();
  const mustHaveAll = filterByInventory ? filterByInventory.checked : false;

  const filtered = allRecipes.filter((recipe) => {
    if (selectedMeal && normalizeKey(recipe.meal) !== selectedMeal) return false;
    if (selectedGoal && normalizeKey(recipe.goal) !== selectedGoal) return false;
    if (query) {
      const inName = normalizeName(recipe.name).includes(query);
      const inIngredients = normalizeName(recipe.ingredients).includes(query);
      if (!inName && !inIngredients) return false;
    }
    if (mustHaveAll) {
      const ingredients = normalizeIngredients(recipe.ingredients);
      const missing = ingredients.filter((item) => !inventory.includes(normalizeName(item)));
      if (missing.length > 0) return false;
    }
    return true;
  });

  if (!filtered.length) {
    recipeList.innerHTML = `<div class="col-12"><div class="alert alert-warning">Nema recepata za ovaj filter.</div></div>`;
    return;
  }

  filtered.forEach((recipe) => {
    const ingredients = normalizeIngredients(recipe.ingredients);
    const missing = ingredients.filter((item) => !inventory.includes(normalizeName(item)));
    const invOk = missing.length === 0;
    const badgeGoal = recipe.goal || "";
    const badgeMeal = recipe.meal || "";

    recipeList.insertAdjacentHTML(
      "beforeend",
      `
      <div class="col-md-6 mb-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <h5 class="card-title mb-2">${escapeHtml(recipe.name || "Recept")}</h5>
              <div>
                <span class="badge badge-goal ${badgeGoal === "gubitak" ? "gubitak" : "odrzavanje"}">${capitalize(badgeGoal)}</span>
                <span class="badge bg-light text-dark ms-1">${capitalize(badgeMeal)}</span>
              </div>
            </div>
            <p class="mb-1"><strong>Opis:</strong> ${escapeHtml(recipe.description || "")}</p>
            <p class="mb-1"><strong>Sastojci:</strong></p>
            <ul class="mb-2">
              ${ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
            <div class="recipe-macros mb-2">
              ${recipe.calories ? `<span>${recipe.calories} kcal</span> &nbsp;` : ""}
              ${recipe.protein ? `<span>${recipe.protein}g proteina</span> &nbsp;` : ""}
              ${recipe.carbs ? `<span>${recipe.carbs}g UH</span> &nbsp;` : ""}
              ${recipe.fat ? `<span>${recipe.fat}g masti</span>` : ""}
            </div>
            <div class="d-flex justify-content-between align-items-center mt-3">
              <div>
                ${
                  invOk
                    ? '<span class="badge text-bg-success">Imas sve</span>'
                    : `<button class="btn btn-outline-danger btn-sm" data-missing="${escapeHtml(missing.join(","))}">Sta fali?</button>`
                }
              </div>
              <div>
                <button class="btn btn-outline-secondary btn-sm me-1" data-edit-id="${recipe.id}">
                  <span class="material-icons" style="font-size:18px;vertical-align:middle;">edit</span>
                </button>
                <button class="btn btn-outline-danger btn-sm" data-delete-id="${recipe.id}" data-name="${escapeHtml(recipe.name || "")}">
                  <span class="material-icons" style="font-size:18px;vertical-align:middle;">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`
    );
  });
}

function normalizeIngredients(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

recipeList.addEventListener("click", async (event) => {
  const missingButton = event.target.closest("[data-missing]");
  if (missingButton) {
    const list = missingButton.dataset.missing.split(",").map((item) => item.trim()).filter(Boolean).join(", ");
    showToast("Nedostaje: " + list, "danger");
    return;
  }

  const editButton = event.target.closest("[data-edit-id]");
  if (editButton) {
    window.location.href = `edit-recipe.html?id=${editButton.dataset.editId}`;
    return;
  }

  const deleteButton = event.target.closest("[data-delete-id]");
  if (!deleteButton) return;

  const id = deleteButton.dataset.deleteId;
  const name = deleteButton.dataset.name || "recept";
  if (!confirm(`Da li sigurno zelis da obrises recept: "${name}"?`)) return;

  try {
    await deleteRecipeById(id);
    allRecipes = allRecipes.filter((recipe) => recipe.id !== id);
    renderRecipes();
    showToast("Recept uspesno obrisan!", "success");
  } catch (error) {
    console.error(error);
    showToast("Greska pri brisanju recepta.", "danger");
  }
});

if (mealFilter) mealFilter.addEventListener("change", renderRecipes);
if (goalFilter) goalFilter.addEventListener("change", renderRecipes);
if (searchInput) searchInput.addEventListener("input", renderRecipes);
if (filterByInventory) filterByInventory.addEventListener("change", renderRecipes);

fetchRecipes();
