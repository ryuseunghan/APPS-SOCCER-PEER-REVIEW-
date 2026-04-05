// Design Ref: §5 — 경기 상세 조회
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMatchById } from "@/lib/queries/matches";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const match = await getMatchById(params.id);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json(match);
}
