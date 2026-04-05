// Design Ref: §4.2 — 리뷰 + MVP 투표 쿼리 헬퍼
import { createServerClient } from "@/lib/supabase";

export interface ReviewSubmitData {
  match_id: string;
  reviewer_id: string;
  reviews: Array<{
    reviewee_id: string;
    skill: number;
    stamina: number;
    teamplay: number;
    comment?: string;
  }>;
  mvp_vote?: string; // voted_for_id
}

export async function submitReviews(data: ReviewSubmitData): Promise<void> {
  const supabase = createServerClient();

  // 리뷰 일괄 삽입
  const reviewRows = data.reviews.map((r) => ({
    match_id: data.match_id,
    reviewer_id: data.reviewer_id,
    reviewee_id: r.reviewee_id,
    skill: r.skill,
    stamina: r.stamina,
    teamplay: r.teamplay,
    comment: r.comment ?? null,
  }));

  const { error: reviewError } = await supabase
    .from("reviews")
    .insert(reviewRows);

  if (reviewError) {
    throw new Error(reviewError.message ?? "리뷰 제출에 실패했습니다.");
  }

  // MVP 투표
  if (data.mvp_vote) {
    const { error: mvpError } = await supabase.from("mvp_votes").insert({
      match_id: data.match_id,
      voter_id: data.reviewer_id,
      voted_for_id: data.mvp_vote,
    });

    if (mvpError) {
      throw new Error(mvpError.message ?? "MVP 투표에 실패했습니다.");
    }
  }
}

export async function getMyReviewCount(
  matchId: string,
  reviewerId: string
): Promise<number> {
  const supabase = createServerClient();
  const { count, error } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("match_id", matchId)
    .eq("reviewer_id", reviewerId);

  if (error) return 0;
  return count ?? 0;
}
