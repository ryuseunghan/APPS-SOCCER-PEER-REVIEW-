import { createServerClient } from "@/lib/supabase";

export type DbUser = {
  id: string;
  username: string;
  name: string;
  jersey_number: number | null;
  password_hash: string;
};

export async function getUserByUsername(
  username: string
): Promise<DbUser | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, name, jersey_number, password_hash")
    .eq("username", username)
    .single();

  if (error || !data) {
    console.log(`[auth-db] err=${error?.code}:${error?.message} data=${!!data}`);
    return null;
  }
  return data as DbUser;
}
