// Design Ref: §5 — GET /api/matches/[id] 소비, 경기 상세 + 참가자 평점 + MVP
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import RatingStar from "@/components/RatingStar";
import { getMatchDetail } from "@/lib/queries/matches";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: Params) {
  const { id } = await params;
  const match = await getMatchDetail(id);

  if (!match) notFound();

  const hasScore = match.our_score !== null && match.opponent_score !== null;
  const isWin = hasScore && match.our_score! > match.opponent_score!;
  const isDraw = hasScore && match.our_score === match.opponent_score;
  const resultLabel = !hasScore ? "-" : isWin ? "승" : isDraw ? "무" : "패";
  const resultColor = !hasScore
    ? "text-[#7B9DD4]"
    : isWin
    ? "text-[#22C55E]"
    : isDraw
    ? "text-[#EAB308]"
    : "text-[#EF4444]";

  const d = new Date(`${match.date}T00:00:00`);
  const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일`;

  return (
    <div className="flex flex-col min-h-full bg-[#0D1B3E]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1B2B5E] lg:bg-[#0D1B3E]/80 lg:backdrop-blur-sm px-4 lg:px-8 py-4 flex items-center gap-3 border-b border-[#243570]">
        <Link href="/matches" className="text-[#7B9DD4] hover:text-white transition-colors">←</Link>
        <h1 className="text-lg font-bold text-white">{dateLabel} 경기</h1>
      </header>

      <div className="flex-1 px-4 lg:px-8 py-4 lg:py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
          {/* 왼쪽: 스코어 + MVP + CTAs */}
          <div className="space-y-5">
            {/* Score Card */}
            <div className="bg-[#1B2B5E] rounded-2xl p-5 text-center space-y-3">
              <p className="text-[#7B9DD4] text-xs">{dateLabel} · {match.time.slice(0, 5)} · {match.place}</p>

              <div className="flex items-center justify-center gap-6">
                <div className="text-center flex-1">
                  <p className="text-[#22C55E] text-xs font-semibold mb-1">우리팀</p>
                  <p className="text-5xl font-bold text-white">
                    {match.our_score ?? "-"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[#7B9DD4] text-2xl font-bold">:</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[#7B9DD4] text-xs font-semibold mb-1">상대팀</p>
                  <p className="text-5xl font-bold text-[#7B9DD4]">
                    {match.opponent_score ?? "-"}
                  </p>
                </div>
              </div>

              {hasScore && (
                <div className="flex justify-center">
                  <span className={`text-xl font-bold ${resultColor}`}>{resultLabel}</span>
                </div>
              )}
            </div>

            {/* MVP */}
            {match.mvp && (
              <div className="bg-[#1B2B5E] rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-xs text-[#7B9DD4]">이 경기 MVP</p>
                  <p className="text-[#F59E0B] font-bold text-lg">{match.mvp.name}</p>
                </div>
              </div>
            )}

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

          {/* 오른쪽: 참여 멤버 */}
          <section>
            <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3">
              참여 멤버 ({match.participants.length}명)
            </h2>
            <div className="bg-[#1B2B5E] rounded-xl divide-y divide-[#243570]">
              {match.participants.length === 0 ? (
                <p className="text-[#7B9DD4] text-sm px-4 py-3">참여 멤버가 없습니다.</p>
              ) : (
                match.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size="md" isMvp={p.id === match.mvp?.id} />
                      <div>
                        <p className="text-white font-medium text-sm">{p.name}</p>
                        <p className="text-[#7B9DD4] text-xs">{p.position ?? "-"}</p>
                      </div>
                    </div>
                    {p.overall > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <RatingStar value={p.overall} size="sm" />
                        <span className="text-[#22C55E] text-sm font-medium">{p.overall}</span>
                      </div>
                    ) : (
                      <span className="text-[#7B9DD4] text-xs">리뷰 대기</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
