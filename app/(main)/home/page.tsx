// Design Ref: §6.6 — Server Component에서 getMatches() + getProfile() 병렬 쿼리
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import RatingStar from "@/components/RatingStar";
import ClubBadge from "@/components/ClubBadge";
import { getMatches } from "@/lib/queries/matches";
import { getProfile } from "@/lib/queries/profile";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [matches, profile] = await Promise.all([
    getMatches(session.user.id),
    getProfile(session.user.id),
  ]);

  // Plan SC: SC-06 pending 경기에 대해서만 "리뷰 대기" 카드 표시
  const pendingMatch = matches.find((m) => m.review_status === "pending");
  const pendingHoursLeft = pendingMatch?.review_deadline
    ? Math.max(
        0,
        Math.floor(
          (new Date(pendingMatch.review_deadline).getTime() - Date.now()) /
            (1000 * 60 * 60)
        )
      )
    : null;

  const recentMatches = matches
    .filter((m) => m.review_status !== "upcoming")
    .slice(0, 3);

  return (
    <div className="flex flex-col min-h-full bg-[#0D1B3E]">
      {/* Header — mobile only */}
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
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
          {/* 왼쪽 컬럼 */}
          <div className="space-y-5">
            {/* 내 레이팅 카드 */}
            <div className="bg-[#1B2B5E] rounded-2xl p-5 space-y-3 shadow-[0_4px_16px_rgba(0,0,0,0.20)]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏅</span>
                <span className="text-[#7B9DD4] text-sm font-medium">내 레이팅</span>
              </div>
              {profile ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#22C55E]">★ {profile.overall}</span>
                    <span className="text-[#7B9DD4] text-sm">/ 5.0</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#243570]">
                    {[
                      { label: "경기력", value: profile.skill },
                      { label: "체력", value: profile.stamina },
                      { label: "태도", value: profile.teamplay },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-[#7B9DD4] text-xs">{label}</p>
                        <p className="text-white font-bold mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-[#7B9DD4] text-sm">경기 {profile.games_played}회</span>
                    <span className="text-[#F59E0B] text-sm font-medium">MVP {profile.mvp_count}회</span>
                  </div>
                </>
              ) : (
                <p className="text-[#7B9DD4] text-sm">경기에 참가하면 레이팅이 집계됩니다.</p>
              )}
            </div>

            {/* 리뷰 대기 카드 */}
            {pendingMatch && pendingHoursLeft !== null && (
              <div className="bg-[#1B2B5E] rounded-2xl p-4 border border-[#22C55E]/50 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse inline-block" />
                  <span className="text-[#22C55E] text-sm font-semibold">리뷰 대기 중</span>
                  <span className="ml-auto text-[#EAB308] text-xs">
                    ⏱ {pendingHoursLeft}시간 남음
                  </span>
                </div>
                <Link href={`/review/${pendingMatch.id}`}>
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
            {recentMatches.length === 0 ? (
              <p className="text-[#7B9DD4] text-sm py-4">참가한 경기가 없습니다.</p>
            ) : (
              recentMatches.map((m) => {
                const d = new Date(`${m.date}T00:00:00`);
                const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일`;
                return (
                  <Link key={m.id} href={`/matches/${m.id}`}>
                    <div className="bg-[#1B2B5E] rounded-xl p-4 flex items-center justify-between hover:bg-[#243570] transition-colors">
                      <div>
                        <p className="text-white font-semibold text-sm">{dateLabel} · {m.place}</p>
                        <p className="text-[#7B9DD4] text-xs mt-0.5">
                          {m.our_score !== null && m.opponent_score !== null
                            ? `우리팀 ${m.our_score} : ${m.opponent_score} 상대팀`
                            : "스코어 미입력"}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}

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
