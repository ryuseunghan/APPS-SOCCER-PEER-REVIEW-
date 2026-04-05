"use client";

// Design Ref: §5 — Step1(정보 입력) + Step2(OTP+타이머) 2단계 회원가입 UI
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClubBadge from "@/components/ClubBadge";

export default function SignupPage() {
  const router = useRouter();

  // Step 1 state
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  // Step 2 state
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초
  const [expired, setExpired] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Plan SC: SC-05 — 비밀번호 불일치 시 제출 불가
  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  // Plan SC: SC-06 — 카운트다운 타이머
  useEffect(() => {
    if (step !== 2) return;
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const timerDisplay = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(
    timeLeft % 60
  ).padStart(2, "0")}`;

  // Step 1 제출: 이메일로 인증번호 발송
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (passwordMismatch) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/signup/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        password,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "오류가 발생했습니다.");
      return;
    }

    setStep(2);
    setTimeLeft(300);
    setExpired(false);
  }

  // 재발송
  async function handleResend() {
    setLoading(true);
    setError("");
    setCode("");

    const res = await fetch("/api/signup/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        password,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "재발송에 실패했습니다.");
      return;
    }

    setTimeLeft(300);
    setExpired(false);
  }

  // Step 2 제출: 인증번호 검증 + 계정 생성
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/signup/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        code,
        name,
        password,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "인증에 실패했습니다.");
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B3E] px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#F59E0B]/20 blur-xl scale-110" />
            <ClubBadge size={72} className="relative drop-shadow-[0_0_16px_rgba(245,158,11,0.4)]" />
          </div>
          <div>
            {step === 1 ? (
              <>
                <h1 className="text-2xl font-bold text-white">회원가입</h1>
                <p className="text-[#7B9DD4] text-sm mt-1">Happy Life FC 멤버로 합류하세요</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white">이메일 인증</h1>
                <p className="text-[#7B9DD4] text-sm mt-1">
                  <span className="text-white font-medium">{email}</span>으로<br />
                  인증번호를 발송했습니다
                </p>
              </>
            )}
          </div>
        </div>

        {/* Step 1: 정보 입력 폼 */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-14 w-full rounded-xl bg-white/10 px-4 text-white placeholder-[#7B9DD4] border border-white/10 focus:outline-none focus:border-[#F59E0B] transition-colors"
            />
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 w-full rounded-xl bg-white/10 px-4 text-white placeholder-[#7B9DD4] border border-white/10 focus:outline-none focus:border-[#F59E0B] transition-colors"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 w-full rounded-xl bg-white/10 px-4 text-white placeholder-[#7B9DD4] border border-white/10 focus:outline-none focus:border-[#F59E0B] transition-colors"
            />
            <div className="flex flex-col gap-1">
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                className={`h-14 w-full rounded-xl bg-white/10 px-4 text-white placeholder-[#7B9DD4] border transition-colors focus:outline-none ${
                  passwordMismatch
                    ? "border-red-400 focus:border-red-400"
                    : "border-white/10 focus:border-[#F59E0B]"
                }`}
              />
              {passwordMismatch && (
                <p className="text-red-400 text-xs px-1">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>
            <input
              type="number"
              placeholder="등번호 (선택)"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              min={1}
              max={99}
              className="h-14 w-full rounded-xl bg-white/10 px-4 text-white placeholder-[#7B9DD4] border border-white/10 focus:outline-none focus:border-[#F59E0B] transition-colors"
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || passwordMismatch || !password || !passwordConfirm}
              className="flex h-14 w-full items-center justify-center rounded-full bg-[#22C55E] text-white font-semibold text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
            >
              {loading ? "발송 중..." : "인증번호 받기"}
            </button>

            <div className="text-center">
              <span className="text-[#7B9DD4] text-sm">이미 계정이 있으신가요? </span>
              <Link href="/" className="text-[#F59E0B] text-sm font-medium underline underline-offset-2">
                로그인
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: 인증번호 입력 */}
        {step === 2 && (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            {/* 타이머 */}
            <div
              className={`flex items-center justify-center rounded-xl px-4 py-3 border ${
                expired
                  ? "bg-red-500/10 border-red-400/30 text-red-400"
                  : timeLeft <= 60
                  ? "bg-yellow-500/10 border-yellow-400/30 text-yellow-400"
                  : "bg-white/5 border-white/10 text-[#7B9DD4]"
              }`}
            >
              <span className="text-sm mr-2">남은 시간</span>
              <span className="font-mono font-bold text-lg">
                {expired ? "만료됨" : timerDisplay}
              </span>
            </div>

            <input
              type="text"
              placeholder="인증번호 6자리"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              required
              className="h-14 w-full rounded-xl bg-white/10 px-4 text-white placeholder-[#7B9DD4] border border-white/10 focus:outline-none focus:border-[#F59E0B] transition-colors text-center text-xl tracking-widest font-mono"
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || expired || code.length !== 6}
              className="flex h-14 w-full items-center justify-center rounded-full bg-[#22C55E] text-white font-semibold text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
            >
              {loading ? "확인 중..." : "확인"}
            </button>

            {/* 재발송 버튼 — 만료 시에만 활성 */}
            <button
              type="button"
              onClick={handleResend}
              disabled={!expired || loading}
              className="flex h-12 w-full items-center justify-center rounded-full border border-white/20 text-[#7B9DD4] text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-30"
            >
              {loading ? "발송 중..." : "인증번호 재발송"}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setError(""); setCode(""); }}
              className="text-[#7B9DD4] text-sm text-center hover:text-white transition-colors"
            >
              이메일 변경
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
