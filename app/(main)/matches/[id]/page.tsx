import Link from "next/link";
import Avatar from "@/components/Avatar";
import RatingStar from "@/components/RatingStar";

// 우리 팀(Happy Life FC) 참여 멤버만 포함
const MATCH_DATA = {
  id: "2",
  date: "4월 3일",
  time: "19:00",
  place: "마포 실내풋살장",
  ourScore: 3,
  opponentScore: 2,
  mvp: { name: "김민준", id: "1" },
  members: [
    { id: "1", name: "김민준", position: "MF", rating: 4.8 },
    { id: "2", name: "이수진", position: "FW", rating: 4.4 },
    { id: "3", name: "박정훈", position: "DF", rating: 4.1 },
    { id: "4", name: "최재원", position: "GK", rating: 3.9 },
    { id: "5", name: "홍현우", position: "MF", rating: 4.2 },
  ],
};

interface Params {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: Params) {
  const { id } = await params;
  const match = MATCH_DATA; // TODO: fetch by id

  const isWin = match.ourScore > match.opponentScore;
  const isDraw = match.ourScore === match.opponentScore;
  const resultLabel = isWin ? "승" : isDraw ? "무" : "패";
  const resultColor = isWin
    ? "text-[#22C55E]"
    : isDraw
    ? "text-[#EAB308]"
    : "text-[#EF4444]";

  return (
    <div className="flex flex-col min-h-full bg-[#0D1B3E]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1B2B5E] px-4 py-4 flex items-center gap-3 border-b border-[#243570]">
        <Link href="/matches" className="text-[#7B9DD4] hover:text-white transition-colors">←</Link>
        <h1 className="text-lg font-bold text-white">{match.date} 경기</h1>
      </header>

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* Score Card */}
        <div className="bg-[#1B2B5E] rounded-2xl p-5 text-center space-y-3">
          <p className="text-[#7B9DD4] text-xs">{match.date} · {match.time} · {match.place}</p>

          <div className="flex items-center justify-center gap-6">
            {/* 우리팀 */}
            <div className="text-center flex-1">
              <p className="text-[#22C55E] text-xs font-semibold mb-1">우리팀</p>
              <p className="text-5xl font-bold text-white">{match.ourScore}</p>
            </div>

            {/* 구분 */}
            <div className="text-center">
              <p className="text-[#7B9DD4] text-2xl font-bold">:</p>
            </div>

            {/* 상대팀 */}
            <div className="text-center flex-1">
              <p className="text-[#7B9DD4] text-xs font-semibold mb-1">상대팀</p>
              <p className="text-5xl font-bold text-[#7B9DD4]">{match.opponentScore}</p>
            </div>
          </div>

          {/* 결과 뱃지 */}
          <div className="flex justify-center">
            <span className={`text-xl font-bold ${resultColor}`}>
              {resultLabel}
            </span>
          </div>
        </div>

        {/* 우리팀 참여 멤버 */}
        <section>
          <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3">
            우리팀 참여 멤버 ({match.members.length}명)
          </h2>
          <div className="bg-[#1B2B5E] rounded-xl divide-y divide-[#243570]">
            {match.members.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} size="md" isMvp={p.id === match.mvp.id} />
                  <div>
                    <p className="text-white font-medium text-sm">{p.name}</p>
                    <p className="text-[#7B9DD4] text-xs">{p.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <RatingStar value={p.rating} size="sm" />
                  <span className="text-[#22C55E] text-sm font-medium">{p.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MVP */}
        <div className="bg-[#1B2B5E] rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs text-[#7B9DD4]">이 경기 MVP</p>
            <p className="text-[#F59E0B] font-bold text-lg">{match.mvp.name}</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <button className="w-full py-3 bg-[#243570] text-[#7B9DD4] rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#3B5CB8] hover:text-white transition-colors">
            <span>📤</span> 결과 공유
          </button>
          <Link href={`/review/${match.id}`}>
            <button className="w-full py-3 bg-[#22C55E] text-white rounded-full font-bold text-sm hover:bg-[#4ADE80] transition-colors">
              리뷰 작성 →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
