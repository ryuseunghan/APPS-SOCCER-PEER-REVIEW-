import Link from "next/link";
import RatingStar from "@/components/RatingStar";
import ClubBadge from "@/components/ClubBadge";

const myStats = {
  overall: 4.2,
  skill: 4.3,
  stamina: 3.9,
  teamplay: 4.4,
  gamesPlayed: 12,
  mvpCount: 2,
};

const pendingReview = {
  matchId: "1",
  hoursLeft: 18,
};

const recentMatches = [
  { id: "2", date: "4월 3일", place: "풋살파크B", scoreA: 3, scoreB: 2, myRating: 4.1 },
  { id: "3", date: "3월 28일", place: "강남 실내풋살", scoreA: 2, scoreB: 2, myRating: 3.8 },
  { id: "4", date: "3월 22일", place: "마포 실내풋살", scoreA: 4, scoreB: 1, myRating: 4.5 },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full bg-[#0D1B3E]">
      {/* Header — mobile only (데스크탑은 SideNav에 있음) */}
      <header className="lg:hidden sticky top-0 z-10 bg-[#1B2B5E] px-4 py-3 flex items-center justify-between border-b border-[#243570]">
        <div className="flex items-center gap-2.5">
          <ClubBadge size={36} />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">MatchRate</h1>
            <p className="text-[#F59E0B] text-[10px] font-semibold leading-none">Happy Life FC</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[#7B9DD4] hover:text-white transition-colors" aria-label="알림">🔔</button>
          <button className="text-[#7B9DD4] hover:text-white transition-colors" aria-label="프로필">👤</button>
        </div>
      </header>

      {/* 데스크탑 헤더 */}
      <header className="hidden lg:flex sticky top-0 z-10 bg-[#0D1B3E]/80 backdrop-blur-sm px-8 py-4 items-center justify-between border-b border-[#243570]">
        <h1 className="text-xl font-bold text-white">홈</h1>
        <div className="flex items-center gap-3">
          <button className="text-[#7B9DD4] hover:text-white transition-colors" aria-label="알림">🔔</button>
          <button className="text-[#7B9DD4] hover:text-white transition-colors" aria-label="프로필">👤</button>
        </div>
      </header>

      <div className="flex-1 px-4 lg:px-8 py-4 lg:py-6">
        {/* 데스크탑: 2컬럼 그리드 */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
          {/* 왼쪽 컬럼 */}
          <div className="space-y-5">
            {/* 내 레이팅 카드 */}
            <div className="bg-[#1B2B5E] rounded-2xl p-5 space-y-3 shadow-[0_4px_16px_rgba(0,0,0,0.20)]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏅</span>
                <span className="text-[#7B9DD4] text-sm font-medium">내 레이팅</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#22C55E]">★ {myStats.overall}</span>
                <span className="text-[#7B9DD4] text-sm">/ 5.0</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#243570]">
                {[
                  { label: "경기력", value: myStats.skill },
                  { label: "체력", value: myStats.stamina },
                  { label: "태도", value: myStats.teamplay },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-[#7B9DD4] text-xs">{label}</p>
                    <p className="text-white font-bold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 pt-1">
                <span className="text-[#7B9DD4] text-sm">경기 {myStats.gamesPlayed}회</span>
                <span className="text-[#F59E0B] text-sm font-medium">MVP {myStats.mvpCount}회</span>
              </div>
            </div>

            {/* 리뷰 대기 카드 */}
            {pendingReview && (
              <div className="bg-[#1B2B5E] rounded-2xl p-4 border border-[#22C55E]/50 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse inline-block" />
                  <span className="text-[#22C55E] text-sm font-semibold">리뷰 대기 중</span>
                  <span className="ml-auto text-[#EAB308] text-xs">
                    ⏱ {pendingReview.hoursLeft}시간 남음
                  </span>
                </div>
                <Link href={`/review/${pendingReview.matchId}`}>
                  <button className="w-full py-2.5 bg-[#22C55E] text-white rounded-full font-semibold text-sm hover:bg-[#4ADE80] transition-colors">
                    지금 리뷰하기 →
                  </button>
                </Link>
              </div>
            )}

            {/* 랭킹 바로가기 */}
            <Link href="/rankings">
              <div className="bg-[#1B2B5E] rounded-xl p-4 flex items-center justify-between hover:bg-[#243570] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-white font-semibold text-sm">동호회 랭킹 보드</p>
                    <p className="text-[#7B9DD4] text-xs mt-0.5">Happy Life FC · 이번 시즌</p>
                  </div>
                </div>
                <span className="text-[#7B9DD4]">→</span>
              </div>
            </Link>
          </div>

          {/* 오른쪽 컬럼 — 최근 경기 */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#7B9DD4] uppercase tracking-wide">최근 경기</h2>
            {recentMatches.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`}>
                <div className="bg-[#1B2B5E] rounded-xl p-4 flex items-center justify-between hover:bg-[#243570] transition-colors">
                  <div>
                    <p className="text-white font-semibold text-sm">{m.date} · {m.place}</p>
                    <p className="text-[#7B9DD4] text-xs mt-0.5">
                      우리팀 {m.scoreA} : {m.scoreB} 상대팀
                    </p>
                  </div>
                  <div className="text-right">
                    <RatingStar value={m.myRating} size="sm" />
                    <p className="text-[#22C55E] text-xs font-medium mt-0.5">{m.myRating}</p>
                  </div>
                </div>
              </Link>
            ))}

            {/* 경기 등록 바로가기 */}
            <Link href="/matches/new">
              <div className="bg-[#1B2B5E] rounded-xl p-4 flex items-center justify-between hover:bg-[#243570] transition-colors border border-dashed border-[#243570]">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-bold">+</span>
                  <p className="text-white text-sm font-medium">새 경기 등록</p>
                </div>
                <span className="text-[#7B9DD4]">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
