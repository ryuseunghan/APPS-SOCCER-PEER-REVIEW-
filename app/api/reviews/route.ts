// Design Ref: §5.4 — 리뷰 + MVP 투표 일괄 제출
// Plan SC: SC-03 리뷰 제출 → 자기자신 리뷰 제외, MVP 중복 투표 방지
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { submitReviews, getMyReviewCount } from "@/lib/queries/reviews";
import { getMatchParticipants } from "@/lib/queries/matches";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { match_id, reviews, mvp_vote } = body;

  if (!match_id || !Array.isArray(reviews) || reviews.length === 0) {
    return NextResponse.json(
      { error: "match_id와 reviews는 필수 항목입니다." },
      { status: 400 }
    );
  }

  // 자기 자신 리뷰 제외 검증
  const hasSelfReview = reviews.some(
    (r: any) => r.reviewee_id === session.user!.id
  );
  if (hasSelfReview) {
    return NextResponse.json(
      { error: "자기 자신은 리뷰할 수 없습니다." },
      { status: 400 }
    );
  }

  // MVP 자기 자신 투표 방지
  if (mvp_vote && mvp_vote === session.user.id) {
    return NextResponse.json(
      { error: "자기 자신에게 MVP를 투표할 수 없습니다." },
      { status: 400 }
    );
  }

  // 중복 리뷰 확인
  const existingCount = await getMyReviewCount(match_id, session.user.id);
  if (existingCount > 0) {
    return NextResponse.json(
      { error: "이미 리뷰를 제출했습니다." },
      { status: 409 }
    );
  }

  // 평점 범위 검증
  for (const r of reviews) {
    if (
      ![r.skill, r.stamina, r.teamplay].every(
        (v) => Number.isInteger(v) && v >= 1 && v <= 5
      )
    ) {
      return NextResponse.json(
        { error: "평점은 1~5 사이의 정수여야 합니다." },
        { status: 400 }
      );
    }
  }

  try {
    await submitReviews({
      match_id,
      reviewer_id: session.user.id,
      reviews,
      mvp_vote,
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "리뷰 제출에 실패했습니다." },
      { status: 500 }
    );
  }
}
