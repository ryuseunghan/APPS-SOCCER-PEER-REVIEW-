import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const { name, email, password, jerseyNumber } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "필수 항목을 입력해주세요." },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // 중복 이메일 확인
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "이미 사용 중인 이메일입니다." },
      { status: 409 }
    );
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { error } = await supabase.from("users").insert({
    name,
    email,
    password_hash,
    jersey_number: jerseyNumber ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: "회원가입에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
