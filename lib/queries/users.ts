// Design Ref: §4.5 — 전체 멤버 목록 쿼리 (경기 등록 시 사용)
import { createServerClient } from "@/lib/supabase";
import type { Position } from "@/types/db";

export interface ClubMember {
  id: string;
  name: string;
  position: Position | null;
  jersey_number: number | null;
}

export async function getUsers(): Promise<ClubMember[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, position, jersey_number")
    .order("name");

  if (error || !data) return [];
  return data as ClubMember[];
}
