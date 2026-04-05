"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClubBadge from "@/components/ClubBadge";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.push("/home");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B3E] px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-10">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#F59E0B]/20 blur-xl scale-110" />
            <ClubBadge size={112} className="relative drop-shadow-[0_0_16px_rgba(245,158,11,0.4)]" />
          </div>

          <div className="space-y-1">
            <p className="text-[#F59E0B] text-xs font-semibold tracking-widest uppercase">
              Happy Life Football Club
            </p>
            <h1 className="text-3xl font-bold text-white tracking-tight">MatchRate</h1>
          </div>

          <div className="space-y-2">
            <p className="text-2xl font-bold text-white leading-tight">경기 후 30초,</p>
            <p className="text-2xl font-bold text-white leading-tight">팀원이 보는</p>
            <p className="text-2xl font-bold text-[#22C55E] leading-tight">내 진짜 레이팅</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center rounded-full bg-[#F59E0B] text-[#1A1A1A] font-semibold text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="text-center">
            <span className="text-[#7B9DD4] text-sm">아직 계정이 없으신가요? </span>
            <Link href="/signup" className="text-[#22C55E] text-sm font-medium underline underline-offset-2">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
