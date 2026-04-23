import { createRecipe } from "./supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addRecipeForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = {
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

    if (!data.name || !data.meal || !data.goal || !data.description || !data.ingredients) {
      showToast("Popuni sva obavezna polja.", "danger");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      showToast("Cuvam recept...", "primary", 1500);
      await createRecipe(data);
      showToast("Recept uspesno dodat!", "success");
      setTimeout(() => (window.location.href = "recipes.html"), 1000);
    } catch (error) {
      console.error(error);
      showToast("Greska pri cuvanju recepta. Proveri Supabase tabelu i policy.", "danger", 5000);
    } finally {
      submitButton.disabled = false;
    }
  });
});
