import {
  getHouseholdInventory,
  getMealPlan,
  getRecipes,
  normalizeKey,
  requireHousehold,
  saveMealPlanItems,
} from "./supabase.js";

const days = ["Ponedeljak", "Utorak", "Sreda", "Cetvrtak", "Petak", "Subota", "Nedelja"];
const meals = ["dorucak", "rucak", "vecera"];

const table = document.getElementById("mealPlanTable");
const saveMsg = document.getElementById("saveMessage");
let context = null;
let allRecipes = [];
let savedPlan = {};

async function initMealPlan() {
  try {
    context = await requireHousehold();
    if (!context) return;

    allRecipes = await getRecipes();
    savedPlan = await getMealPlan(context.household.id);
    await migrateLocalPlan();
    renderTable();
  } catch (error) {
    console.error(error);
    table.innerHTML = `<tr><td colspan="4" class="text-danger">Household plan nije dostupan. Pokreni supabase/households.sql.</td></tr>`;
  }
}

function normalizeMeal(value) {
  return normalizeKey(value);
}

function renderTable() {
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

async function saveMealPlan() {
  const selects = document.querySelectorAll("#mealPlanTable select");
  const plan = {};

  selects.forEach((select) => {
    const day = select.dataset.day;
    const meal = select.dataset.meal;
    if (!plan[day]) plan[day] = {};
    plan[day][meal] = select.value;
  });

  savedPlan = plan;
  await saveMealPlanItems(context.household.id, plan);
  localStorage.removeItem("weeklyPlan");
  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingBought");

  if (saveMsg) {
    saveMsg.classList.remove("d-none");
    setTimeout(() => saveMsg.classList.add("d-none"), 2000);
  } else {
    showToast("Plan je sacuvan za household.", "success");
  }
}

async function generateShoppingList() {
  await saveMealPlan();
  const selectedIds = getSelectedIds(savedPlan);

  if (!selectedIds.length) {
    showToast("Nema sacuvanog plana.", "warning");
    return;
  }

  const selectedRecipes = allRecipes.filter((recipe) => selectedIds.includes(recipe.id));
  const inventory = (await getHouseholdInventory(context.household.id)).map((item) => item.ingredient_key);
  const ingredients = selectedRecipes.flatMap((recipe) => normalizeIngredients(recipe.ingredients));
  const finalList = [...new Set(ingredients.map(normalizeKey))].filter((item) => !inventory.includes(item));

  localStorage.removeItem("shoppingList");
  localStorage.removeItem("shoppingBought");

  if (!finalList.length) {
    showToast("Imas sve potrebne sastojke za izabrane recepte.", "success");
    return;
  }

  showToast("Lista za kupovinu je napravljena.", "info", 3000);
  setTimeout(() => (window.location.href = "shopping-list.html"), 650);
}

async function migrateLocalPlan() {
  if (Object.keys(savedPlan).length) return;
  const raw = localStorage.getItem("weeklyPlan");
  if (!raw) return;

  try {
    const localPlan = JSON.parse(raw);
    if (!Object.keys(localPlan).length) return;
    savedPlan = localPlan;
    await saveMealPlanItems(context.household.id, savedPlan);
    localStorage.removeItem("weeklyPlan");
    showToast("Lokalni plan je prebacen u household.", "success", 5000);
  } catch {
    // Ignore broken legacy localStorage.
  }
}

function getSelectedIds(plan) {
  return [
    ...new Set(
      Object.values(plan)
        .flatMap((dayObj) => meals.map((meal) => dayObj[meal]))
        .filter(Boolean)
    ),
  ];
}

function normalizeIngredients(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

window.saveMealPlan = saveMealPlan;
window.generateShoppingList = generateShoppingList;

initMealPlan();
