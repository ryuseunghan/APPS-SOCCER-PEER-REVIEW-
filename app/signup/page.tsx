"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClubBadge from "@/components/ClubBadge";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordMismatch) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "회원가입에 실패했습니다.");
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
            <h1 className="text-2xl font-bold text-white">회원가입</h1>
            <p className="text-[#7B9DD4] text-sm mt-1">Happy Life FC 멤버로 합류하세요</p>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || passwordMismatch || !password || !passwordConfirm}
            className="flex h-14 w-full items-center justify-center rounded-full bg-[#22C55E] text-white font-semibold text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
          >
            {loading ? "가입 중..." : "가입하기"}
          </button>

          <div className="text-center">
            <span className="text-[#7B9DD4] text-sm">이미 계정이 있으신가요? </span>
            <Link href="/" className="text-[#F59E0B] text-sm font-medium underline underline-offset-2">
              로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
