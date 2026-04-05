// Design Ref: §4.4 — 프로필 + 성장 그래프 쿼리
// Plan SC: SC-05 프로필 페이지가 실DB 기반 평점·경기수·MVP 횟수 표시
import { createServerClient } from "@/lib/supabase";
import type { Position } from "@/types/db";
import type { PlayerRanking } from "./rankings";

export interface GrowthDataPoint {
  label: string; // 'M/D'
  value: number; // 해당 경기 overall 평균
}

export interface MyProfile extends PlayerRanking {
  mom_count: number;
  growth_data: GrowthDataPoint[];
}

export async function getProfile(userId: string): Promise<MyProfile | null> {
  const supabase = createServerClient();

  // 유저 정보
  const { data: user, error: uError } = await supabase
    .from("users")
    .select("id, name, position, jersey_number")
    .eq("id", userId)
    .single();

  if (uError || !user) return null;

  // 경기 참가 횟수
  const { count: gamesPlayed } = await supabase
    .from("match_participants")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // 전체 리뷰 (평점 집계용)
  const { data: reviews } = await supabase
    .from("reviews")
    .select("skill, stamina, teamplay")
    .eq("reviewee_id", userId);

  // MVP 횟수
  const { count: mvpCount } = await supabase
    .from("mvp_votes")
    .select("*", { count: "exact", head: true })
    .eq("voted_for_id", userId);

  // 최근 6경기 성장 그래프
  const { data: recentParticipations } = await supabase
    .from("match_participants")
    .select("matches(id, date)")
    .eq("user_id", userId)
    .order("match_id", { ascending: false })
    .limit(6);

  const growthData: GrowthDataPoint[] = [];

  if (recentParticipations) {
    for (const p of recentParticipations) {
      const match = (p as any).matches;
      if (!match) continue;

      const { data: matchReviews } = await supabase
        .from("reviews")
        .select("skill, stamina, teamplay")
        .eq("match_id", match.id)
        .eq("reviewee_id", userId);

      if (!matchReviews || matchReviews.length === 0) continue;

      const overalls = matchReviews.map(
        (r: any) => (r.skill + r.stamina + r.teamplay) / 3
      );
      const avg =
        Math.round(
          (overalls.reduce((a: number, b: number) => a + b, 0) /
            overalls.length) *
            10
        ) / 10;

      const d = new Date(match.date);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      growthData.push({ label, value: avg });
    }
    growthData.reverse(); // 오래된 순으로
  }

  const avg = (arr: any[], key: string) => {
    if (!arr || arr.length === 0) return 0;
    return (
      Math.round(
        (arr.reduce((a, b) => a + b[key], 0) / arr.length) * 10
      ) / 10
    );
  };

  const skill = avg(reviews ?? [], "skill");
  const stamina = avg(reviews ?? [], "stamina");
  const teamplay = avg(reviews ?? [], "teamplay");
  const overall =
    reviews && reviews.length > 0
      ? Math.round(((skill + stamina + teamplay) / 3) * 10) / 10
      : 0;

  return {
    id: user.id,
    name: user.name,
    position: user.position ?? null,
    jersey_number: user.jersey_number ?? null,
    overall,
    skill,
    stamina,
    teamplay,
    games_played: gamesPlayed ?? 0,
    mvp_count: mvpCount ?? 0,
    mom_count: mvpCount ?? 0,
    growth_data: growthData,
  };
}
