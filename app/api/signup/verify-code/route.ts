// Design Ref: §4.2 — OTP 검증 + 계정 생성
// Plan SC: SC-01(인증 후 계정 생성), SC-02(코드 검증 필수), SC-03(만료 처리)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const { email, code, name, password, jerseyNumber } = await request.json();

  if (!email || !code || !name || !password) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const supabase = createServerClient();

  // 최신 미사용 인증 코드 조회
  const { data: verification } = await supabase
    .from("email_verifications")
    .select("id, code, expires_at")
    .eq("email", email)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!verification) {
    return NextResponse.json({ error: "인증번호가 올바르지 않습니다." }, { status: 401 });
  }

  // 만료 확인
  if (new Date(verification.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "인증번호가 만료되었습니다. 재발송 후 다시 시도해주세요." },
      { status: 410 }
    );
  }

  // 코드 일치 확인
  if (verification.code !== code) {
    return NextResponse.json({ error: "인증번호가 올바르지 않습니다." }, { status: 401 });
  }

  // 비밀번호 해싱 + 계정 생성
  const password_hash = await bcrypt.hash(password, 12);

  const { error: insertError } = await supabase.from("users").insert({
    email,
    name,
    password_hash,
    jersey_number: jerseyNumber ?? null,
  });

  if (insertError) {
    return NextResponse.json({ error: "회원가입에 실패했습니다." }, { status: 500 });
  }

  // 인증 코드 사용 처리
  await supabase
    .from("email_verifications")
    .update({ used: true })
    .eq("id", verification.id);

  return NextResponse.json({ success: true });
}
