import fs from "node:fs/promises";

const SUPABASE_URL = "https://syygollgxgnnurjtlewl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aVXh1K021JPGDtTaPfi0Rw_GJs6iqDo";

const raw = await fs.readFile(new URL("../data/recipes.json", import.meta.url), "utf8");
const recipes = JSON.parse(raw).map((recipe) => ({
  name: recipe.name,
  meal: normalizeMeal(recipe.meal),
  goal: normalizeGoal(recipe.goal),
  description: recipe.description || "",
  ingredients: Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((item) => String(item).trim()).filter(Boolean)
    : String(recipe.ingredients || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
  calories: recipe.nutrition?.calories ?? recipe.calories ?? null,
  protein: recipe.nutrition?.protein ?? recipe.protein ?? null,
  carbs: recipe.nutrition?.carbs ?? recipe.carbs ?? null,
  fat: recipe.nutrition?.fat ?? recipe.fat ?? null,
}));

const response = await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
  method: "POST",
  headers: {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify(recipes),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Seed failed: ${response.status} ${body}`);
}

console.log(`Seeded ${recipes.length} recipes into Supabase.`);

function normalizeMeal(value) {
  const normalized = normalize(value);
  if (normalized === "dorucak") return "dorucak";
  if (normalized === "rucak") return "rucak";
  if (normalized === "vecera") return "vecera";
  return normalized;
}

function normalizeGoal(value) {
  const normalized = normalize(value);
  if (normalized === "odrzavanje") return "odrzavanje";
  return normalized;
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/ž/g, "z")
    .replace(/š/g, "s")
    .replace(/đ/g, "dj");
}
