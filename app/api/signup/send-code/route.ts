// Design Ref: §4.1 — 이메일 중복 확인 + OTP 발송
// Plan SC: SC-02(인증번호 없이 가입 불가), SC-04(중복 이메일 차단)
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { email, name, password, jerseyNumber } = await request.json();

  if (!email || !name || !password) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  // 이메일 형식 검증
  if (!email.includes("@") || !email.includes(".")) {
    return NextResponse.json({ error: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = createServerClient();

  // 중복 이메일 확인
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  // 6자리 인증번호 생성
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후

  // 기존 미사용 코드 무효화 (재발송 시)
  await supabase
    .from("email_verifications")
    .update({ used: true })
    .eq("email", email)
    .eq("used", false);

  // 새 코드 저장
  const { error: insertError } = await supabase.from("email_verifications").insert({
    email,
    code,
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }

  // 이메일 발송
  try {
    await sendVerificationEmail(email, code);
  } catch {
    return NextResponse.json({ error: "이메일 발송에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
