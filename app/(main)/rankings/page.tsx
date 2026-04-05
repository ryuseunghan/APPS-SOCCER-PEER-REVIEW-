// Design Ref: §6.4 — Server Component에서 getRankings() 직접 쿼리
import { auth } from "@/auth";
import Avatar from "@/components/Avatar";
import RatingStar from "@/components/RatingStar";
import ClubBadge from "@/components/ClubBadge";
import { getRankings } from "@/lib/queries/rankings";

const rankMedal = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
};

export default async function RankingsPage() {
  const session = await auth();
  const myId = session?.user?.id ?? null;

  const rankings = await getRankings();
  const myRank = rankings.findIndex((p) => p.id === myId) + 1;

  return (
    <div className="flex flex-col min-h-full bg-[#0D1B3E]">
      {/* 모바일 헤더 */}
      <header className="lg:hidden sticky top-0 z-10 bg-[#1B2B5E] px-4 py-3 border-b border-[#243570]">
        <div className="flex items-center gap-3">
          <ClubBadge size={40} />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">랭킹 보드</h1>
            <p className="text-[#F59E0B] text-[11px] font-semibold leading-none">
              Happy Life Football Club
            </p>
          </div>
        </div>
      </header>

      {/* 데스크탑 헤더 */}
      <header className="hidden lg:flex sticky top-0 z-10 bg-[#0D1B3E]/80 backdrop-blur-sm px-8 py-4 items-center gap-3 border-b border-[#243570]">
        <ClubBadge size={36} />
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">랭킹 보드</h1>
          <p className="text-[#F59E0B] text-xs font-semibold">Happy Life Football Club</p>
        </div>
      </header>

      <div className="flex-1 px-4 lg:px-8 py-4 lg:py-6 space-y-4 lg:max-w-2xl">
        {rankings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#7B9DD4] text-sm">아직 리뷰 데이터가 없습니다.</p>
            <p className="text-[#7B9DD4] text-xs mt-1">경기 후 팀원 리뷰를 남기면 랭킹이 집계돼요.</p>
          </div>
        ) : (
          <>
            {/* Top 3 */}
            <div className="bg-[#1B2B5E] rounded-2xl divide-y divide-[#243570]">
              {rankings.slice(0, 3).map((player, i) => {
                const rank = i + 1;
                const isMe = player.id === myId;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center px-4 py-3.5 gap-3 ${isMe ? "bg-[#22C55E]/10" : ""}`}
                  >
                    <span className="text-xl w-7 text-center">{rankMedal(rank)}</span>
                    <Avatar name={player.name} size="md" />
                    <div className="flex-1">
                      <span className="text-white font-semibold text-sm">{player.name}</span>
                      {isMe && (
                        <span className="ml-1 text-[#22C55E] text-xs font-medium">(나)</span>
                      )}
                      <p className="text-[#7B9DD4] text-xs">{player.position ?? "-"}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RatingStar value={player.overall} size="sm" />
                      <span className="text-[#22C55E] font-bold text-sm">★ {player.overall}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rest */}
            {rankings.length > 3 && (
              <div className="bg-[#1B2B5E] rounded-2xl divide-y divide-[#243570]">
                {rankings.slice(3).map((player, i) => {
                  const rank = i + 4;
                  const isMe = player.id === myId;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center px-4 py-3 gap-3 ${isMe ? "bg-[#22C55E]/10" : ""}`}
                    >
                      <span className="text-[#7B9DD4] text-sm w-7 text-center font-medium">{rank}</span>
                      <Avatar name={player.name} size="md" />
                      <div className="flex-1">
                        <span className="text-white text-sm">{player.name}</span>
                        {isMe && (
                          <span className="ml-1 text-[#22C55E] text-xs font-medium">(나)</span>
                        )}
                      </div>
                      <span className="text-[#7B9DD4] text-sm font-medium">★ {player.overall}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* My position reminder (if not in top view) */}
            {myRank > 6 && (
              <div className="bg-[#1B2B5E] rounded-xl px-4 py-3 flex items-center justify-between border border-[#22C55E]/30">
                <div className="flex items-center gap-3">
                  <span className="text-[#7B9DD4] text-sm font-medium">{myRank}위</span>
                  <Avatar name="나" size="md" isSelected />
                  <span className="text-[#22C55E] text-sm font-semibold">나 ({myRank}위)</span>
                </div>
                <span className="text-[#7B9DD4] text-sm font-medium">
                  ★ {rankings[myRank - 1]?.overall ?? "-"}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
