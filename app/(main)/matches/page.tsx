// Design Ref: §6.1 — Server Component에서 getMatches() 직접 쿼리
import Link from "next/link";
import { auth } from "@/auth";
import ReviewStatusBadge from "@/components/ReviewStatusBadge";
import ClubBadge from "@/components/ClubBadge";
import { getMatches } from "@/lib/queries/matches";

export default async function MatchesPage() {
  const session = await auth();
  const matches = await getMatches(session?.user?.id ?? undefined);

  const upcoming = matches.filter((m) => m.review_status === "upcoming");
  const done = matches.filter((m) => m.review_status !== "upcoming");

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
        {matches.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#7B9DD4] text-sm">등록된 경기가 없습니다.</p>
            <Link href="/matches/new" className="mt-4 inline-block text-[#22C55E] text-sm font-medium underline underline-offset-2">
              첫 경기를 등록해보세요
            </Link>
          </div>
        )}

        {/* 예정 경기 */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3 uppercase tracking-wide">
              예정
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {upcoming.map((m) => {
                const d = new Date(`${m.date}T00:00:00`);
                const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
                const weekday = weekdays[d.getDay()];
                const dateLabel = `${d.getMonth() + 1 < 10 ? "0" : ""}${d.getMonth() + 1}.${d.getDate() < 10 ? "0" : ""}${d.getDate()}`;
                return (
                  <Link key={m.id} href={`/matches/${m.id}`}>
                    <MatchCard
                      weekday={weekday}
                      date={dateLabel}
                      time={m.time.slice(0, 5)}
                      place={m.place}
                      participantCount={m.participant_count}
                      reviewStatus={m.review_status}
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 완료 경기 */}
        {done.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3 uppercase tracking-wide">
              완료
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {done.map((m) => {
                const d = new Date(`${m.date}T00:00:00`);
                const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
                const weekday = weekdays[d.getDay()];
                const dateLabel = `${d.getMonth() + 1 < 10 ? "0" : ""}${d.getMonth() + 1}.${d.getDate() < 10 ? "0" : ""}${d.getDate()}`;
                return (
                  <Link key={m.id} href={`/matches/${m.id}`}>
                    <MatchCard
                      weekday={weekday}
                      date={dateLabel}
                      time={m.time.slice(0, 5)}
                      place={m.place}
                      participantCount={m.participant_count}
                      reviewStatus={m.review_status}
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MatchCard({
  weekday,
  date,
  time,
  place,
  participantCount,
  reviewStatus,
}: {
  weekday: string;
  date: string;
  time: string;
  place: string;
  participantCount: number;
  reviewStatus: "upcoming" | "pending" | "in_progress" | "completed" | "closed";
}) {
  return (
    <div className="bg-[#1B2B5E] rounded-xl p-4 space-y-2 hover:bg-[#243570] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-semibold">
            {weekday}{" "}
            <span className="text-[#22C55E]">{date}</span>{" "}
            {time}
          </p>
          <p className="text-[#7B9DD4] text-sm mt-0.5">{place}</p>
        </div>
        <ReviewStatusBadge status={reviewStatus} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#7B9DD4]">
          참가 {participantCount}명
        </span>
      </div>
    </div>
  );
}
