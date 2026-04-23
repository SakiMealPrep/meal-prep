import { getRecipes } from "./supabase.js";

const days = ["Ponedeljak", "Utorak", "Sreda", "Cetvrtak", "Petak", "Subota", "Nedelja"];
const meals = ["dorucak", "rucak", "vecera"];

const table = document.getElementById("mealPlanTable");
const saveMsg = document.getElementById("saveMessage");
let allRecipes = [];

async function initMealPlan() {
  try {
    allRecipes = await getRecipes();
    renderTable();
  } catch (error) {
    console.error(error);
    table.innerHTML = `<tr><td colspan="4" class="text-danger">Supabase tabela recipes nije dostupna.</td></tr>`;
  }
}

function normalizeMeal(value) {
  return normalizeName(value)
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/ž/g, "z")
    .replace(/š/g, "s")
    .replace(/đ/g, "dj");
}

function renderTable() {
  const savedPlan = getSavedPlan();
  table.innerHTML = "";

  days.forEach((day) => {
    const tr = document.createElement("tr");
    const tdDay = document.createElement("td");
    tdDay.textContent = day;
    tr.appendChild(tdDay);

    meals.forEach((meal) => {
      const td = document.createElement("td");
      const select = document.createElement("select");
      select.className = "form-select";
      select.dataset.day = day;
      select.dataset.meal = meal;

      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "---";
      select.appendChild(emptyOption);

      allRecipes
        .filter((recipe) => normalizeMeal(recipe.meal) === meal)
        .forEach((recipe) => {
          const option = document.createElement("option");
          option.value = recipe.id;
          option.textContent = recipe.name || "Recept";
          if (savedPlan[day] && savedPlan[day][meal] === recipe.id) option.selected = true;
          select.appendChild(option);
        });

      td.appendChild(select);
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });
}

function saveMealPlan() {
  const selects = document.querySelectorAll("#mealPlanTable select");
  const plan = {};

  selects.forEach((select) => {
    const day = select.dataset.day;
    const meal = select.dataset.meal;
    if (!plan[day]) plan[day] = {};
    plan[day][meal] = select.value;
  });

  localStorage.setItem("weeklyPlan", JSON.stringify(plan));
  if (saveMsg) {
    saveMsg.classList.remove("d-none");
    setTimeout(() => saveMsg.classList.add("d-none"), 2000);
  } else {
    showToast("Plan je sacuvan!", "success");
  }
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

function generateShoppingList() {
  const plan = getSavedPlan();
  const selectedIds = [
    ...new Set(
      Object.values(plan)
        .flatMap((dayObj) => meals.map((meal) => dayObj[meal]))
        .filter(Boolean)
    ),
  ];

  if (!selectedIds.length) {
    showToast("Nema sacuvanog plana.", "warning");
    return;
  }

  const selectedRecipes = allRecipes.filter((recipe) => selectedIds.includes(recipe.id));
  const inventory = getInventory();
  const ingredients = selectedRecipes.flatMap((recipe) => normalizeIngredients(recipe.ingredients));
  const finalList = [...new Set(ingredients.map(normalizeKey))].filter((item) => !inventory.includes(item));

  if (!finalList.length) {
    localStorage.removeItem("shoppingList");
    localStorage.removeItem("shoppingBought");
    showToast("Imas sve potrebne sastojke za izabrane recepte.", "success");
    return;
  }

  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingBought");
  showToast("Lista za kupovinu je napravljena.", "info", 3000);
  setTimeout(() => (window.location.href = "shopping-list.html"), 650);
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

function normalizeIngredients(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeName(name) {
  return name ? name.trim().toLowerCase() : "";
}

function normalizeKey(value) {
  return normalizeName(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "dj");
}

window.saveMealPlan = saveMealPlan;
window.generateShoppingList = generateShoppingList;

initMealPlan();
