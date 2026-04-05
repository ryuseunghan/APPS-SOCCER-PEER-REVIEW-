// Design Ref: §5 — 경기 참가자 목록 (ReviewFlow에서 호출)
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMatchParticipants } from "@/lib/queries/matches";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const participants = await getMatchParticipants(id);
  return NextResponse.json(participants);
}
