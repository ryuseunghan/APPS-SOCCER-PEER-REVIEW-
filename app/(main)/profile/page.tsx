import Avatar from "@/components/Avatar";
import RatingStar from "@/components/RatingStar";
import GrowthChart from "./GrowthChart";
import ClubBadge from "@/components/ClubBadge";

const myProfile = {
  name: "박정훈",
  position: "DF",
  gamesPlayed: 12,
  overall: 4.2,
  skill: 4.3,
  stamina: 3.9,
  teamplay: 4.4,
  mvpCount: 2,
  momCount: 4,
};

const growthData = [
  { label: "3/1", value: 3.6 },
  { label: "3/8", value: 3.8 },
  { label: "3/15", value: 3.9 },
  { label: "3/22", value: 4.0 },
  { label: "3/28", value: 3.8 },
  { label: "4/3", value: 4.2 },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-full bg-[#0D1B3E]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1B2B5E] px-4 py-4 flex items-center justify-between border-b border-[#243570]">
        <h1 className="text-lg font-bold text-white">내 프로필</h1>
        <button className="text-[#7B9DD4] hover:text-white transition-colors text-sm">⋮ 설정</button>
      </header>

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* 선수 카드 */}
        <div className="bg-[#1B2B5E] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={myProfile.name} size="xl" />
            <div className="flex-1">
              <p className="text-white font-bold text-xl">{myProfile.name}</p>
              <p className="text-[#7B9DD4] text-sm">
                {myProfile.position} · 경기 {myProfile.gamesPlayed}회
              </p>
            </div>
            {/* 소속 클럽 배지 */}
            <div className="flex flex-col items-center gap-1">
              <ClubBadge size={44} />
              <span className="text-[#F59E0B] text-[9px] font-semibold leading-none text-center">
                Happy Life FC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RatingStar value={myProfile.overall} size="lg" />
            <span className="text-[#22C55E] text-2xl font-bold ml-1">{myProfile.overall}</span>
          </div>

          {/* Radar-style stats bars */}
          <div className="space-y-3 pt-2 border-t border-[#243570]">
            {[
              { label: "경기력", value: myProfile.skill },
              { label: "체력", value: myProfile.stamina },
              { label: "태도", value: myProfile.teamplay },
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
              <span className="text-white text-sm font-semibold">MVP {myProfile.mvpCount}회</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#22C55E]">🥇</span>
              <span className="text-white text-sm font-semibold">MOM {myProfile.momCount}회</span>
            </div>
          </div>
        </div>

        {/* 성장 그래프 */}
        <section>
          <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3 uppercase tracking-wide">
            성장 그래프 (최근 6경기)
          </h2>
          <div className="bg-[#1B2B5E] rounded-2xl p-4">
            <GrowthChart data={growthData} />
          </div>
        </section>

        {/* Share CTA */}
        <button className="w-full py-4 bg-[#22C55E] text-white rounded-full font-bold text-base flex items-center justify-center gap-2 hover:bg-[#4ADE80] transition-colors">
          <span>📤</span> 선수 카드 공유
        </button>
      </div>
    </div>
  );
}
