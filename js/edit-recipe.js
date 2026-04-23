import { getRecipe, updateRecipe } from "./supabase.js";

const form = document.getElementById("editRecipeForm");
const id = new URLSearchParams(window.location.search).get("id");

if (!id) {
  showToast("Nedostaje ID recepta!", "danger", 5000);
  setTimeout(() => (window.location.href = "recipes.html"), 1800);
} else {
  loadRecipe(id);
}

async function loadRecipe(recipeId) {
  try {
    const recipe = await getRecipe(recipeId);
    populateForm(recipe);
  } catch (error) {
    console.error(error);
    showToast("Recept nije pronadjen u Supabase bazi.", "danger", 5000);
    setTimeout(() => (window.location.href = "recipes.html"), 2200);
  }
}

function populateForm(recipe) {
  form.id.value = recipe.id || "";
  form.name.value = recipe.name || "";
  form.meal.value = recipe.meal || "";
  form.goal.value = recipe.goal || "";
  form.description.value = recipe.description || "";
  form.ingredients.value = recipe.ingredients || "";
  form.calories.value = recipe.calories || "";
  form.protein.value = recipe.protein || "";
  form.carbs.value = recipe.carbs || "";
  form.fat.value = recipe.fat || "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const recipe = {
    name: form.name.value.trim(),
    meal: form.meal.value,
    goal: form.goal.value,
    description: form.description.value.trim(),
    ingredients: form.ingredients.value,
    calories: form.calories.value,
    protein: form.protein.value,
    carbs: form.carbs.value,
    fat: form.fat.value,
  };

  if (!recipe.name || !recipe.meal || !recipe.goal || !recipe.description || !recipe.ingredients) {
    showToast("Sva obavezna polja moraju biti popunjena.", "danger", 4000);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    await updateRecipe(id, recipe);
    showToast("Recept uspesno izmenjen!", "success");
    setTimeout(() => (window.location.href = "recipes.html"), 1000);
  } catch (error) {
    console.error(error);
    showToast("Greska pri izmeni recepta. Proveri Supabase policy.", "danger", 5000);
  } finally {
    submitButton.disabled = false;
  }
});
