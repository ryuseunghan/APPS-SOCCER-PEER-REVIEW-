import Avatar from "@/components/Avatar";
import RatingStar from "@/components/RatingStar";
import ClubBadge from "@/components/ClubBadge";

const MY_ID = "3";

const rankings = [
  { id: "1", name: "김민준", position: "MF", overall: 4.6, skill: 4.9, stamina: 4.3, teamplay: 4.6 },
  { id: "2", name: "이수진", position: "FW", overall: 4.4, skill: 4.5, stamina: 4.1, teamplay: 4.5 },
  { id: "6", name: "박준혁", position: "FW", overall: 4.2, skill: 4.3, stamina: 4.0, teamplay: 4.3 },
  { id: "7", name: "최서연", position: "MF", overall: 4.1, skill: 4.0, stamina: 3.9, teamplay: 4.4 },
  { id: "8", name: "홍태양", position: "DF", overall: 3.9, skill: 3.7, stamina: 4.1, teamplay: 3.9 },
  { id: "9", name: "김민서", position: "MF", overall: 3.8, skill: 3.9, stamina: 3.6, teamplay: 3.9 },
  { id: "3", name: "박정훈", position: "DF", overall: 3.8, skill: 3.8, stamina: 3.6, teamplay: 4.0 }, // me
  { id: "5", name: "홍현우", position: "MF", overall: 3.7, skill: 3.8, stamina: 3.5, teamplay: 3.8 },
  { id: "4", name: "최재원", position: "GK", overall: 3.5, skill: 3.4, stamina: 3.6, teamplay: 3.5 },
];

type Category = "overall" | "skill" | "stamina" | "teamplay";

const categoryLabels: Record<Category, string> = {
  overall: "종합",
  skill: "경기력",
  stamina: "체력",
  teamplay: "태도",
};

const rankMedal = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
};

export default function RankingsPage() {
  // Default: sort by overall descending
  const sorted = [...rankings].sort((a, b) => b.overall - a.overall);
  const myRank = sorted.findIndex((p) => p.id === MY_ID) + 1;

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
        {/* Category filter — static display, interactivity needs client component */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(Object.keys(categoryLabels) as Category[]).map((cat) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                cat === "overall"
                  ? "bg-[#22C55E] text-white"
                  : "bg-[#1B2B5E] text-[#7B9DD4] border border-[#243570] hover:border-[#3B5CB8]"
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Top 3 */}
        <div className="bg-[#1B2B5E] rounded-2xl divide-y divide-[#243570]">
          {sorted.slice(0, 3).map((player, i) => {
            const rank = i + 1;
            const isMe = player.id === MY_ID;
            return (
              <div
                key={player.id}
                className={`flex items-center px-4 py-3.5 gap-3 ${
                  isMe ? "bg-[#22C55E]/10" : ""
                }`}
              >
                <span className="text-xl w-7 text-center">{rankMedal(rank)}</span>
                <Avatar name={player.name} size="md" />
                <div className="flex-1">
                  <span className="text-white font-semibold text-sm">{player.name}</span>
                  {isMe && (
                    <span className="ml-1 text-[#22C55E] text-xs font-medium">(나)</span>
                  )}
                  <p className="text-[#7B9DD4] text-xs">{player.position}</p>
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
        <div className="bg-[#1B2B5E] rounded-2xl divide-y divide-[#243570]">
          {sorted.slice(3).map((player, i) => {
            const rank = i + 4;
            const isMe = player.id === MY_ID;
            return (
              <div
                key={player.id}
                className={`flex items-center px-4 py-3 gap-3 ${
                  isMe ? "bg-[#22C55E]/10" : ""
                }`}
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

        {/* My position reminder (if not in top view) */}
        {myRank > 6 && (
          <div className="bg-[#1B2B5E] rounded-xl px-4 py-3 flex items-center justify-between border border-[#22C55E]/30">
            <div className="flex items-center gap-3">
              <span className="text-[#7B9DD4] text-sm font-medium">{myRank}위</span>
              <Avatar name="나" size="md" isSelected />
              <span className="text-[#22C55E] text-sm font-semibold">나 ({myRank}위)</span>
            </div>
            <span className="text-[#7B9DD4] text-sm font-medium">
              ★ {sorted[myRank - 1]?.overall}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
