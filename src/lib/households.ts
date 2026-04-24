import { supabase } from "./supabase";

export type Household = {
  id: string;
  name: string;
  created_at: string;
  role: "owner" | "admin" | "member";
};

export type InviteStatus =
  | "valid"
  | "invalid"
  | "expired"
  | "used"
  | "already_member";

export type InvitePreview = {
  status: InviteStatus;
  household_id: string | null;
  household_name: string | null;
  invite_email: string | null;
  expires_at: string | null;
};

export async function listHouseholds() {
  const { data, error } = await supabase
    .from("household_members")
    .select("role, households(id, name, created_at)")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.households)
    .map((row) => ({
      ...(Array.isArray(row.households) ? row.households[0] : row.households),
      role: row.role,
    })) as Household[];
}

export async function createHousehold(name: string) {
  const { data, error } = await supabase.rpc("create_household_with_owner", {
    household_name: name,
  });

  if (error) throw error;
  return data as string;
}

export async function createInvite(householdId: string, email: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to create invites.");

  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const tokenHash = await sha256(token);

  const { data, error } = await supabase
    .from("household_invites")
    .insert({
      household_id: householdId,
      email: email.trim().toLowerCase(),
      token_hash: tokenHash,
      created_by: user.id,
    })
    .select("id, expires_at")
    .single();

  if (error) throw error;

  return {
    token,
    expiresAt: data.expires_at as string,
  };
}

export async function previewInvite(token: string) {
  const { data, error } = await supabase.rpc("get_household_invite", {
    invite_token: token,
  });

  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as InvitePreview;
}

export async function acceptInvite(token: string) {
  const { data, error } = await supabase.rpc("accept_household_invite", {
    invite_token: token,
  });

  if (error) throw error;
  return data as string;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
