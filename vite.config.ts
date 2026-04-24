import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        app: resolve(__dirname, "app.html"),
        recipes: resolve(__dirname, "recipes.html"),
        mealPlan: resolve(__dirname, "meal-plan.html"),
        shoppingList: resolve(__dirname, "shopping-list.html"),
        inventory: resolve(__dirname, "inventory.html"),
        settings: resolve(__dirname, "settings.html"),
        household: resolve(__dirname, "household.html"),
        login: resolve(__dirname, "login.html"),
        signup: resolve(__dirname, "signup.html"),
        about: resolve(__dirname, "about.html"),
        addRecipe: resolve(__dirname, "add-recipe.html"),
        editRecipe: resolve(__dirname, "edit-recipe.html"),
      },
    },
  },
});
