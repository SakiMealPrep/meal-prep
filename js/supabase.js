import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://syygollgxgnnurjtlewl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aVXh1K021JPGDtTaPfi0Rw_GJs6iqDo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

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
    household_id: recipe.household_id || null,
  };
}

export function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "dj")
    .replace(/Ä‘/g, "dj");
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getHouseholds() {
  const user = await getCurrentUser();
  if (!user) return [];

  const memberHouseholds = await getMemberHouseholds();
  if (memberHouseholds.length) return memberHouseholds;

  await repairMyHouseholds().catch(() => null);

  const repairedHouseholds = await getMemberHouseholds();
  if (repairedHouseholds.length) return repairedHouseholds;

  const { data: createdHouseholds, error: createdError } = await supabase
    .from("households")
    .select("id, name, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (createdError) throw createdError;

  const households = (createdHouseholds || []).map((household) => ({ ...household, role: "owner" }));

  await Promise.all(
    households.map((household) =>
      supabase
        .from("household_members")
        .upsert({ household_id: household.id, user_id: user.id, role: "owner" })
        .catch(() => null)
    )
  );

  return households;
}

async function getMemberHouseholds() {
  const { data, error } = await supabase
    .from("household_members")
    .select("role, households(id, name, created_at)")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || [])
    .filter((row) => row.households)
    .map((row) => ({ ...row.households, role: row.role }));
}

export async function getCurrentHousehold() {
  const households = await getHouseholds();
  const saved = localStorage.getItem("activeHouseholdId");
  const selected = households.find((household) => household.id === saved) || households[0] || null;
  if (selected) localStorage.setItem("activeHouseholdId", selected.id);
  return selected;
}

function isMissingRpc(error) {
  return error?.code === "PGRST202" || error?.status === 404 || String(error?.message || "").includes("schema cache");
}

export async function claimCreatedHousehold() {
  const { data: householdId, error } = await supabase.rpc("claim_created_household");
  if (error) throw error;
  if (householdId) localStorage.setItem("activeHouseholdId", householdId);
  return householdId;
}

export async function repairMyHouseholds() {
  const { data: householdId, error } = await supabase.rpc("repair_my_households");
  if (error) throw error;
  if (householdId) localStorage.setItem("activeHouseholdId", householdId);
  return householdId;
}

export async function requireSession() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "index.html")}`;
    return null;
  }
  return user;
}

export async function requireHousehold() {
  const user = await requireSession();
  if (!user) return null;

  const household = await getCurrentHousehold();
  if (!household) {
    window.location.href = "household.html";
    return null;
  }

  return { user, household };
}

export async function createHousehold(name) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Morate biti ulogovani.");

  const repairedHouseholdId = await repairMyHouseholds().catch(() => null);
  if (repairedHouseholdId) return { id: repairedHouseholdId, name };

  const { data: rpcHouseholdId, error: rpcError } = await supabase.rpc("create_household_with_owner", {
    household_name: name,
  });

  if (!rpcError && rpcHouseholdId) {
    localStorage.setItem("activeHouseholdId", rpcHouseholdId);
    return { id: rpcHouseholdId, name };
  }

  if (rpcError && !isMissingRpc(rpcError)) throw rpcError;

  const householdId = crypto.randomUUID();
  const { error: householdError } = await supabase
    .from("households")
    .insert({ id: householdId, name, created_by: user.id });

  if (householdError) throw householdError;

  const { error: memberError } = await supabase
    .from("household_members")
    .insert({ household_id: householdId, user_id: user.id, role: "owner" });

  if (memberError) {
    const claimedHouseholdId = await claimCreatedHousehold().catch(() => null);
    if (claimedHouseholdId) return { id: claimedHouseholdId, name };
    throw memberError;
  }

  localStorage.setItem("activeHouseholdId", householdId);
  return { id: householdId, name };
}

export async function getInvite(token) {
  const { data, error } = await supabase
    .from("household_invites")
    .select("id, token, household_id, expires_at, used_at, households(name)")
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createHouseholdInvite(householdId) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Morate biti ulogovani.");

  const token = crypto.randomUUID().replaceAll("-", "");
  const { data, error } = await supabase
    .from("household_invites")
    .insert({ household_id: householdId, token, created_by: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function acceptInvite(token) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Morate biti ulogovani.");

  const invite = await getInvite(token);
  if (!invite || invite.used_at) throw new Error("Pozivnica nije dostupna.");

  const { data: householdId, error } = await supabase.rpc("accept_household_invite", { invite_token: token });
  if (error) throw error;

  localStorage.setItem("activeHouseholdId", householdId || invite.household_id);
  return invite;
}

export async function listHouseholdMembers(householdId) {
  const { data, error } = await supabase
    .from("household_members")
    .select("user_id, role, created_at")
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getHouseholdInventory(householdId) {
  const { data, error } = await supabase
    .from("household_inventory")
    .select("ingredient_key, label")
    .eq("household_id", householdId)
    .order("label", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function setHouseholdInventory(householdId, items) {
  const user = await getCurrentUser();
  const normalized = new Map();
  items.forEach((item) => {
    const key = normalizeKey(item.key || item.label || item);
    const label = item.label || String(item);
    if (key) normalized.set(key, { household_id: householdId, ingredient_key: key, label, updated_by: user?.id || null });
  });

  const existing = await getHouseholdInventory(householdId);
  const nextKeys = new Set(normalized.keys());
  const deleteKeys = existing.map((item) => item.ingredient_key).filter((key) => !nextKeys.has(key));

  if (deleteKeys.length) {
    const { error } = await supabase
      .from("household_inventory")
      .delete()
      .eq("household_id", householdId)
      .in("ingredient_key", deleteKeys);
    if (error) throw error;
  }

  const rows = Array.from(normalized.values());
  if (rows.length) {
    const { error } = await supabase.from("household_inventory").upsert(rows);
    if (error) throw error;
  }
}

export async function addHouseholdInventoryItems(householdId, items) {
  const existing = await getHouseholdInventory(householdId);
  const merged = new Map(existing.map((item) => [item.ingredient_key, { key: item.ingredient_key, label: item.label }]));
  items.forEach((item) => {
    const key = normalizeKey(item.key || item.label || item);
    const label = item.label || String(item);
    if (key) merged.set(key, { key, label });
  });
  await setHouseholdInventory(householdId, Array.from(merged.values()));
}

export async function getMealPlan(householdId) {
  const { data, error } = await supabase
    .from("meal_plan_items")
    .select("day, meal, recipe_id")
    .eq("household_id", householdId);

  if (error) throw error;

  const plan = {};
  (data || []).forEach((item) => {
    if (!plan[item.day]) plan[item.day] = {};
    plan[item.day][item.meal] = item.recipe_id || "";
  });
  return plan;
}

export async function saveMealPlanItems(householdId, plan) {
  const user = await getCurrentUser();
  const rows = [];
  Object.entries(plan).forEach(([day, meals]) => {
    Object.entries(meals).forEach(([meal, recipeId]) => {
      rows.push({
        household_id: householdId,
        day,
        meal,
        recipe_id: recipeId || null,
        updated_by: user?.id || null,
      });
    });
  });

  const { error } = await supabase.from("meal_plan_items").upsert(rows);
  if (error) throw error;
}

export async function getRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

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
  const user = await getCurrentUser();
  const payload = mapRecipePayload(recipe);
  payload.created_by = user?.id || null;
  const { data, error } = await supabase
    .from("recipes")
    .insert(payload)
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
