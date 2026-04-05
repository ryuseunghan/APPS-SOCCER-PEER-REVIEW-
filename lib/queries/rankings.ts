// Design Ref: §4.3 — 랭킹 집계 쿼리 (경기 1회 이상 참가한 유저만)
// Plan SC: SC-04 랭킹 페이지가 실DB 집계 데이터로 렌더링
import { createServerClient } from "@/lib/supabase";
import type { Position } from "@/types/db";

export interface PlayerRanking {
  id: string;
  name: string;
  position: Position | null;
  jersey_number: number | null;
  overall: number;
  skill: number;
  stamina: number;
  teamplay: number;
  games_played: number;
  mvp_count: number;
}

export async function getRankings(): Promise<PlayerRanking[]> {
  const supabase = createServerClient();

  // 참가자 목록 (경기 1회 이상인 유저)
  const { data: participants, error: pError } = await supabase
    .from("match_participants")
    .select("user_id");

  if (pError || !participants) return [];

  const userIds = [...new Set(participants.map((p: any) => p.user_id))];
  if (userIds.length === 0) return [];

  // 유저 정보
  const { data: users, error: uError } = await supabase
    .from("users")
    .select("id, name, position, jersey_number")
    .in("id", userIds);

  if (uError || !users) return [];

  // 리뷰 집계
  const { data: reviews, error: rError } = await supabase
    .from("reviews")
    .select("reviewee_id, skill, stamina, teamplay")
    .in("reviewee_id", userIds);

  // MVP 투표 집계
  const { data: mvpVotes, error: mError } = await supabase
    .from("mvp_votes")
    .select("voted_for_id")
    .in("voted_for_id", userIds);

  // 경기 횟수 집계
  const { data: matchCounts, error: mcError } = await supabase
    .from("match_participants")
    .select("user_id")
    .in("user_id", userIds);

  const reviewMap = new Map<
    string,
    { skill: number[]; stamina: number[]; teamplay: number[] }
  >();
  const mvpMap = new Map<string, number>();
  const gamesMap = new Map<string, number>();

  for (const uid of userIds) {
    reviewMap.set(uid, { skill: [], stamina: [], teamplay: [] });
    mvpMap.set(uid, 0);
    gamesMap.set(uid, 0);
  }

  if (!rError && reviews) {
    for (const r of reviews) {
      const entry = reviewMap.get(r.reviewee_id);
      if (entry) {
        entry.skill.push(r.skill);
        entry.stamina.push(r.stamina);
        entry.teamplay.push(r.teamplay);
      }
    }
  }

  if (!mError && mvpVotes) {
    for (const v of mvpVotes) {
      mvpMap.set(v.voted_for_id, (mvpMap.get(v.voted_for_id) ?? 0) + 1);
    }
  }

  if (!mcError && matchCounts) {
    for (const mp of matchCounts) {
      gamesMap.set(mp.user_id, (gamesMap.get(mp.user_id) ?? 0) + 1);
    }
  }

  const avg = (arr: number[]) =>
    arr.length === 0
      ? 0
      : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;

  const rankings: PlayerRanking[] = users.map((u: any) => {
    const rv = reviewMap.get(u.id)!;
    const skill = avg(rv.skill);
    const stamina = avg(rv.stamina);
    const teamplay = avg(rv.teamplay);
    const overall =
      rv.skill.length > 0
        ? Math.round(((skill + stamina + teamplay) / 3) * 10) / 10
        : 0;

    return {
      id: u.id,
      name: u.name,
      position: u.position ?? null,
      jersey_number: u.jersey_number ?? null,
      overall,
      skill,
      stamina,
      teamplay,
      games_played: gamesMap.get(u.id) ?? 0,
      mvp_count: mvpMap.get(u.id) ?? 0,
    };
  });

  return rankings.sort((a, b) => b.overall - a.overall);
}
