import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://syygollgxgnnurjtlewl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aVXh1K021JPGDtTaPfi0Rw_GJs6iqDo";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeIngredients(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapRecipe(row) {
  return {
    ...row,
    ingredients: normalizeIngredients(row.ingredients).join(", "),
    calories: row.calories ?? "",
    protein: row.protein ?? "",
    carbs: row.carbs ?? "",
    fat: row.fat ?? "",
  };
}

function mapRecipePayload(recipe) {
  return {
    name: recipe.name?.trim() || "",
    meal: recipe.meal || "",
    goal: recipe.goal || "",
    description: recipe.description?.trim() || "",
    ingredients: normalizeIngredients(recipe.ingredients),
    calories: toNumber(recipe.calories),
    protein: toNumber(recipe.protein),
    carbs: toNumber(recipe.carbs),
    fat: toNumber(recipe.fat),
  };
}

export async function getRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []).map(mapRecipe);
}

export async function getRecipe(id) {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return mapRecipe(data);
}

export async function createRecipe(recipe) {
  const { data, error } = await supabase
    .from("recipes")
    .insert(mapRecipePayload(recipe))
    .select()
    .single();

  if (error) throw error;
  return mapRecipe(data);
}

export async function updateRecipe(id, recipe) {
  const { data, error } = await supabase
    .from("recipes")
    .update(mapRecipePayload(recipe))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapRecipe(data);
}

export async function deleteRecipeById(id) {
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}
