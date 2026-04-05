// Design Ref: §4.1 — Server Component용 직접 DB 쿼리 헬퍼
import { createServerClient } from "@/lib/supabase";
import type { DbMatch, DbUser, ReviewStatus } from "@/types/db";
import type { ClubMember } from "./users";

export interface MatchWithStatus extends DbMatch {
  participant_count: number;
  review_status: ReviewStatus;
}

export interface MatchParticipantWithRating extends ClubMember {
  overall: number;
  skill: number;
  stamina: number;
  teamplay: number;
}

export interface MatchDetail extends DbMatch {
  participants: MatchParticipantWithRating[];
  mvp: ClubMember | null;
}

function deriveReviewStatus(
  match: DbMatch,
  myReviewCount: number,
  totalReviewees: number,
  userId?: string
): ReviewStatus {
  const matchDt = new Date(`${match.date}T${match.time}`);
  const now = new Date();
  const deadline = match.review_deadline
    ? new Date(match.review_deadline)
    : null;

  if (matchDt > now) return "upcoming";
  if (deadline && deadline < now) return "closed";
  if (!userId) return "pending";
  if (totalReviewees > 0 && myReviewCount >= totalReviewees) return "completed";
  return "pending";
}

export async function getMatches(userId?: string): Promise<MatchWithStatus[]> {
  const supabase = createServerClient();

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*, match_participants(count)")
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  if (error || !matches) return [];

  const results: MatchWithStatus[] = await Promise.all(
    matches.map(async (m: any) => {
      const participantCount: number = m.match_participants?.[0]?.count ?? 0;

      let myReviewCount = 0;
      if (userId) {
        const { count } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("match_id", m.id)
          .eq("reviewer_id", userId);
        myReviewCount = count ?? 0;
      }

      const totalReviewees = Math.max(0, participantCount - 1);
      const review_status = deriveReviewStatus(
        m,
        myReviewCount,
        totalReviewees,
        userId
      );

      return {
        id: m.id,
        date: m.date,
        time: m.time,
        place: m.place,
        our_score: m.our_score,
        opponent_score: m.opponent_score,
        review_deadline: m.review_deadline,
        created_by: m.created_by,
        created_at: m.created_at,
        participant_count: participantCount,
        review_status,
      };
    })
  );

  return results;
}

export async function getMatchById(id: string): Promise<DbMatch | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as DbMatch;
}

export async function createMatch(input: {
  date: string;
  time: string;
  place: string;
  our_score?: number | null;
  opponent_score?: number | null;
  participant_ids: string[];
  created_by: string;
}): Promise<DbMatch> {
  const supabase = createServerClient();

  // review_deadline = 경기 일시 + 48시간
  const matchDt = new Date(`${input.date}T${input.time}`);
  const reviewDeadline = new Date(matchDt.getTime() + 48 * 60 * 60 * 1000);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      date: input.date,
      time: input.time,
      place: input.place,
      our_score: input.our_score ?? null,
      opponent_score: input.opponent_score ?? null,
      review_deadline: reviewDeadline.toISOString(),
      created_by: input.created_by,
    })
    .select()
    .single();

  if (matchError || !match) {
    throw new Error(matchError?.message ?? "경기 등록에 실패했습니다.");
  }

  // 참가자 일괄 삽입
  const participants = input.participant_ids.map((uid) => ({
    match_id: match.id,
    user_id: uid,
  }));

  const { error: participantsError } = await supabase
    .from("match_participants")
    .insert(participants);

  if (participantsError) {
    // 참가자 삽입 실패 시 경기 롤백
    await supabase.from("matches").delete().eq("id", match.id);
    throw new Error("참가자 등록에 실패했습니다.");
  }

  return match as DbMatch;
}

export async function getMatchParticipants(
  matchId: string
): Promise<ClubMember[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("match_participants")
    .select("users(id, name, position, jersey_number)")
    .eq("match_id", matchId);

  if (error || !data) return [];
  return data.map((row: any) => row.users as ClubMember).filter(Boolean);
}

export async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  const supabase = createServerClient();

  const match = await getMatchById(matchId);
  if (!match) return null;

  const participants = await getMatchParticipants(matchId);

  // 각 참가자의 평점 집계
  const { data: reviews } = await supabase
    .from("reviews")
    .select("reviewee_id, skill, stamina, teamplay")
    .eq("match_id", matchId);

  // MVP: 가장 많은 표를 받은 참가자
  const { data: mvpVotes } = await supabase
    .from("mvp_votes")
    .select("voted_for_id")
    .eq("match_id", matchId);

  const mvpCount = new Map<string, number>();
  if (mvpVotes) {
    for (const v of mvpVotes) {
      mvpCount.set(v.voted_for_id, (mvpCount.get(v.voted_for_id) ?? 0) + 1);
    }
  }
  let mvpId: string | null = null;
  let maxVotes = 0;
  for (const [id, count] of mvpCount) {
    if (count > maxVotes) { maxVotes = count; mvpId = id; }
  }
  const mvp = mvpId ? (participants.find((p) => p.id === mvpId) ?? null) : null;

  const avg = (arr: number[]) =>
    arr.length === 0
      ? 0
      : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;

  const participantsWithRating: MatchParticipantWithRating[] = participants.map((p) => {
    const pReviews = reviews?.filter((r: any) => r.reviewee_id === p.id) ?? [];
    const skill = avg(pReviews.map((r: any) => r.skill));
    const stamina = avg(pReviews.map((r: any) => r.stamina));
    const teamplay = avg(pReviews.map((r: any) => r.teamplay));
    const overall =
      pReviews.length > 0
        ? Math.round(((skill + stamina + teamplay) / 3) * 10) / 10
        : 0;
    return { ...p, overall, skill, stamina, teamplay };
  });

  return { ...match, participants: participantsWithRating, mvp };
}
