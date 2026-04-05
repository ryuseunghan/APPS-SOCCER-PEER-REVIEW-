// Design Ref: §6 — Resend 클라이언트 + 인증 이메일 템플릿
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail(to: string, code: string) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to,
    subject: "[Happy Life FC] 이메일 인증번호",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0D1B3E;">Happy Life FC 이메일 인증</h2>
        <p>아래 인증번호를 입력해주세요. 유효시간은 <strong>5분</strong>입니다.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                    text-align: center; padding: 24px; background: #f3f4f6;
                    border-radius: 8px; margin: 24px 0; color: #0D1B3E;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          본인이 요청하지 않은 경우 이 이메일을 무시하세요.
        </p>
      </div>
    `,
  });
}
