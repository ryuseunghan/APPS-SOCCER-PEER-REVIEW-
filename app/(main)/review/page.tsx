// Design Ref: §6 — Server Component에서 getMatches()로 리뷰 목록 표시
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReviewStatusBadge from "@/components/ReviewStatusBadge";
import { getMatches } from "@/lib/queries/matches";

export default async function ReviewListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const matches = await getMatches(session.user.id);

  const pendingReviews = matches.filter((m) => m.review_status === "pending");
  const completedReviews = matches.filter((m) => m.review_status === "completed");

  return (
    <div className="flex flex-col min-h-full bg-[#0D1B3E]">
      {/* 모바일 헤더 */}
      <header className="lg:hidden sticky top-0 z-10 bg-[#1B2B5E] px-4 py-4 border-b border-[#243570]">
        <h1 className="text-lg font-bold text-white">리뷰</h1>
      </header>

      {/* 데스크탑 헤더 */}
      <header className="hidden lg:flex sticky top-0 z-10 bg-[#0D1B3E]/80 backdrop-blur-sm px-8 py-4 items-center border-b border-[#243570]">
        <h1 className="text-xl font-bold text-white">리뷰</h1>
      </header>

      <div className="flex-1 px-4 lg:px-8 py-4 lg:py-6 space-y-6 lg:max-w-2xl">
        {pendingReviews.length === 0 && completedReviews.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#7B9DD4] text-sm">참가한 경기가 없습니다.</p>
          </div>
        )}

        {/* 대기 중 */}
        {pendingReviews.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3 uppercase tracking-wide">
              리뷰 대기 중
            </h2>
            {pendingReviews.map((m) => {
              const d = new Date(`${m.date}T00:00:00`);
              const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
              const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
              const hoursLeft = m.review_deadline
                ? Math.max(
                    0,
                    Math.floor(
                      (new Date(m.review_deadline).getTime() - Date.now()) /
                        (1000 * 60 * 60)
                    )
                  )
                : null;

              return (
                <Link key={m.id} href={`/review/${m.id}`}>
                  <div className="bg-[#1B2B5E] rounded-xl p-4 border border-[#22C55E]/40 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-semibold">{dateLabel} {m.time.slice(0, 5)}</p>
                        <p className="text-[#7B9DD4] text-sm mt-0.5">{m.place}</p>
                      </div>
                      <ReviewStatusBadge status="pending" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#7B9DD4]">참가 {m.participant_count}명</span>
                      {hoursLeft !== null && (
                        <span className="text-[#EAB308] text-xs font-medium">
                          ⏱ {hoursLeft}시간 남음
                        </span>
                      )}
                    </div>

                    <button className="w-full py-2.5 bg-[#22C55E] text-white rounded-full font-semibold text-sm hover:bg-[#4ADE80] transition-colors">
                      지금 리뷰하기 →
                    </button>
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {/* 완료 */}
        {completedReviews.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3 uppercase tracking-wide">
              완료된 리뷰
            </h2>
            <div className="space-y-3">
              {completedReviews.map((m) => {
                const d = new Date(`${m.date}T00:00:00`);
                const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
                const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
                return (
                  <Link key={m.id} href={`/matches/${m.id}`}>
                    <div className="bg-[#1B2B5E] rounded-xl p-4 space-y-2 hover:bg-[#243570] transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-semibold">{dateLabel} {m.time.slice(0, 5)}</p>
                          <p className="text-[#7B9DD4] text-sm mt-0.5">{m.place}</p>
                        </div>
                        <ReviewStatusBadge status="completed" />
                      </div>
                    </div>
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
