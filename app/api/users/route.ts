// Design Ref: §5 — 전체 멤버 목록 API (Client Component에서 호출)
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUsers } from "@/lib/queries/users";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await getUsers();
  return NextResponse.json(users);
}
