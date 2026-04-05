// Design Ref: §5.2, §5.3 — 경기 목록 조회 + 경기 등록
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMatches, createMatch } from "@/lib/queries/matches";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matches = await getMatches(session.user.id);
  return NextResponse.json(matches);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { date, time, place, our_score, opponent_score, participant_ids } =
    body;

  if (!date || !time || !place) {
    return NextResponse.json(
      { error: "date, time, place는 필수 항목입니다." },
      { status: 400 }
    );
  }

  if (!Array.isArray(participant_ids) || participant_ids.length === 0) {
    return NextResponse.json(
      { error: "참가자를 1명 이상 선택해주세요." },
      { status: 400 }
    );
  }

  try {
    const match = await createMatch({
      date,
      time,
      place,
      our_score: our_score ?? null,
      opponent_score: opponent_score ?? null,
      participant_ids,
      created_by: session.user.id,
    });
    return NextResponse.json(match, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "경기 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
