// Design Ref: §3.1 — users 테이블 email 컬럼 기반 조회
import { createServerClient } from "@/lib/supabase";

export type DbUser = {
  id: string;
  email: string;
  name: string;
  jersey_number: number | null;
  password_hash: string;
};

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, jersey_number, password_hash")
    .eq("email", email)
    .single();

  if (error || !data) return null;
  return data as DbUser;
}
