import Link from "next/link";
import ClubBadge from "@/components/ClubBadge";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B3E] px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-10">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-8">
          {/* Club Logo */}
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

          <p className="text-[#7B9DD4] text-sm leading-relaxed">
            동호회원이 경기 후 서로 평가하고 성장하는 피어리뷰 플랫폼
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Link
            href="/home"
            className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#FEE500] text-[#1A1A1A] font-semibold text-base transition-opacity hover:opacity-90 active:opacity-80"
          >
            <span className="text-xl">🟡</span>
            카카오로 시작하기
          </Link>

          <div className="text-center">
            <span className="text-[#7B9DD4] text-sm">이미 계정이 있으신가요? </span>
            <Link href="/home" className="text-[#22C55E] text-sm font-medium underline underline-offset-2">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
