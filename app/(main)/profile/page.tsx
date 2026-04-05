// Design Ref: §6.5 — Server Component에서 getProfile() 직접 쿼리
// Plan SC: SC-05 프로필 페이지가 실DB 기반 평점·경기수·MVP 횟수 표시
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import RatingStar from "@/components/RatingStar";
import GrowthChart from "./GrowthChart";
import ClubBadge from "@/components/ClubBadge";
import { getProfile } from "@/lib/queries/profile";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const profile = await getProfile(session.user.id);

  if (!profile) {
    return (
      <div className="flex flex-col min-h-full bg-[#0D1B3E] items-center justify-center">
        <p className="text-[#7B9DD4]">프로필을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#0D1B3E]">
      {/* 모바일 헤더 */}
      <header className="lg:hidden sticky top-0 z-10 bg-[#1B2B5E] px-4 py-4 flex items-center justify-between border-b border-[#243570]">
        <h1 className="text-lg font-bold text-white">내 프로필</h1>
        <button className="text-[#7B9DD4] hover:text-white transition-colors text-sm">⋮ 설정</button>
      </header>

      {/* 데스크탑 헤더 */}
      <header className="hidden lg:flex sticky top-0 z-10 bg-[#0D1B3E]/80 backdrop-blur-sm px-8 py-4 items-center justify-between border-b border-[#243570]">
        <h1 className="text-xl font-bold text-white">내 프로필</h1>
        <button className="text-[#7B9DD4] hover:text-white transition-colors text-sm">⋮ 설정</button>
      </header>

      <div className="flex-1 px-4 lg:px-8 py-4 lg:py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
          {/* 왼쪽: 선수 카드 */}
          <div className="space-y-5">
            <div className="bg-[#1B2B5E] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name={profile.name} size="xl" />
                <div className="flex-1">
                  <p className="text-white font-bold text-xl">{profile.name}</p>
                  <p className="text-[#7B9DD4] text-sm">
                    {profile.position ?? "-"} · 경기 {profile.games_played}회
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ClubBadge size={44} />
                  <span className="text-[#F59E0B] text-[9px] font-semibold leading-none text-center">
                    Happy Life FC
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RatingStar value={profile.overall} size="lg" />
                <span className="text-[#22C55E] text-2xl font-bold ml-1">{profile.overall}</span>
              </div>

              {/* Radar-style stats bars */}
              <div className="space-y-3 pt-2 border-t border-[#243570]">
                {[
                  { label: "경기력", value: profile.skill },
                  { label: "체력", value: profile.stamina },
                  { label: "태도", value: profile.teamplay },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-[#7B9DD4] text-sm w-14">{label}</span>
                    <div className="flex-1 h-2 bg-[#243570] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#22C55E] rounded-full transition-all"
                        style={{ width: `${(value / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-bold w-8 text-right">{value}</span>
                  </div>
                ))}
              </div>

              {/* Awards */}
              <div className="flex gap-4 pt-2 border-t border-[#243570]">
                <div className="flex items-center gap-2">
                  <span className="text-[#F59E0B]">🏆</span>
                  <span className="text-white text-sm font-semibold">MVP {profile.mvp_count}회</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#22C55E]">🥇</span>
                  <span className="text-white text-sm font-semibold">MOM {profile.mom_count}회</span>
                </div>
              </div>
            </div>

            {/* Share CTA */}
            <button className="w-full py-4 bg-[#22C55E] text-white rounded-full font-bold text-base flex items-center justify-center gap-2 hover:bg-[#4ADE80] transition-colors">
              <span>📤</span> 선수 카드 공유
            </button>
          </div>

          {/* 오른쪽: 성장 그래프 */}
          {profile.growth_data.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3 uppercase tracking-wide">
                성장 그래프 (최근 {profile.growth_data.length}경기)
              </h2>
              <div className="bg-[#1B2B5E] rounded-2xl p-4">
                <GrowthChart data={profile.growth_data} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
