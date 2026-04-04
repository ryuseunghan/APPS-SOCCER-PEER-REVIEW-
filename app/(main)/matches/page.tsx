import Link from "next/link";
import ReviewStatusBadge from "@/components/ReviewStatusBadge";
import ClubBadge from "@/components/ClubBadge";

const matches = [
  {
    id: "1",
    weekday: "토",
    date: "04.06",
    time: "10:00",
    place: "풋살파크 강남 B코트",
    joinedCount: 8,
    totalCount: 10,
    reviewStatus: "pending" as const,
    upcoming: true,
  },
  {
    id: "2",
    weekday: "목",
    date: "04.03",
    time: "19:00",
    place: "마포 실내풋살장",
    joinedCount: 10,
    totalCount: 10,
    reviewStatus: "completed" as const,
    upcoming: false,
  },
  {
    id: "3",
    weekday: "토",
    date: "03.28",
    time: "10:00",
    place: "강남 실내풋살",
    joinedCount: 8,
    totalCount: 8,
    reviewStatus: "completed" as const,
    upcoming: false,
  },
];

export default function MatchesPage() {
  const upcoming = matches.filter((m) => m.upcoming);
  const done = matches.filter((m) => !m.upcoming);

  return (
    <div className="flex flex-col min-h-full bg-[#0D1B3E]">
      {/* 모바일 헤더 */}
      <header className="lg:hidden sticky top-0 z-10 bg-[#1B2B5E] px-4 py-3 flex items-center justify-between border-b border-[#243570]">
        <div className="flex items-center gap-2.5">
          <ClubBadge size={36} />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">경기 일정</h1>
            <p className="text-[#F59E0B] text-[10px] font-semibold leading-none">Happy Life FC</p>
          </div>
        </div>
        <Link
          href="/matches/new"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#22C55E] text-white font-bold text-lg hover:bg-[#4ADE80] transition-colors"
          aria-label="경기 등록"
        >
          +
        </Link>
      </header>

      {/* 데스크탑 헤더 */}
      <header className="hidden lg:flex sticky top-0 z-10 bg-[#0D1B3E]/80 backdrop-blur-sm px-8 py-4 items-center justify-between border-b border-[#243570]">
        <h1 className="text-xl font-bold text-white">경기 일정</h1>
        <Link
          href="/matches/new"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#22C55E] text-white font-semibold text-sm hover:bg-[#4ADE80] transition-colors"
        >
          <span className="font-bold text-base leading-none">+</span> 경기 등록
        </Link>
      </header>

      <div className="flex-1 px-4 lg:px-8 py-4 lg:py-6 space-y-6">
        {/* 예정 경기 */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3 uppercase tracking-wide">
              예정
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {upcoming.map((m) => (
                <Link key={m.id} href={`/matches/${m.id}`}>
                  <MatchCard match={m} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 완료 경기 */}
        <section>
          <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3 uppercase tracking-wide">
            완료
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {done.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`}>
                <MatchCard match={m} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MatchCard({
  match,
}: {
  match: {
    weekday: string;
    date: string;
    time: string;
    place: string;
    joinedCount: number;
    totalCount: number;
    reviewStatus: "pending" | "in_progress" | "completed" | "closed";
    upcoming: boolean;
  };
}) {
  return (
    <div className="bg-[#1B2B5E] rounded-xl p-4 space-y-2 hover:bg-[#243570] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-semibold">
            {match.weekday}{" "}
            <span className="text-[#22C55E]">{match.date}</span>{" "}
            {match.time}
          </p>
          <p className="text-[#7B9DD4] text-sm mt-0.5">{match.place}</p>
        </div>
        <ReviewStatusBadge status={match.reviewStatus} />
      </div>

      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-[#243570] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#22C55E] rounded-full"
            style={{ width: `${(match.joinedCount / match.totalCount) * 100}%` }}
          />
        </div>
        <span className="text-xs text-[#7B9DD4]">
          참가 {match.joinedCount} / {match.totalCount}명
        </span>
      </div>
    </div>
  );
}
