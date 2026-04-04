import Link from "next/link";
import ReviewStatusBadge from "@/components/ReviewStatusBadge";

const pendingReviews = [
  {
    matchId: "1",
    date: "4월 6일 (토)",
    place: "풋살파크 강남 B코트",
    time: "10:00",
    deadline: "18시간",
    reviewedCount: 6,
    totalCount: 9,
  },
];

const completedReviews = [
  {
    matchId: "2",
    date: "4월 3일 (목)",
    place: "마포 실내풋살장",
    time: "19:00",
    reviewedCount: 10,
    totalCount: 10,
  },
];

export default function ReviewListPage() {
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
        {/* 대기 중 */}
        {pendingReviews.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3 uppercase tracking-wide">
              리뷰 대기 중
            </h2>
            {pendingReviews.map((r) => (
              <Link key={r.matchId} href={`/review/${r.matchId}`}>
                <div className="bg-[#1B2B5E] rounded-xl p-4 border border-[#22C55E]/40 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold">{r.date} {r.time}</p>
                      <p className="text-[#7B9DD4] text-sm mt-0.5">{r.place}</p>
                    </div>
                    <ReviewStatusBadge status="pending" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-[#243570] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22C55E] rounded-full"
                          style={{ width: `${(r.reviewedCount / r.totalCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#7B9DD4]">
                        {r.reviewedCount}/{r.totalCount}명 완료
                      </span>
                    </div>
                    <span className="text-[#EAB308] text-xs font-medium">
                      ⏱ {r.deadline} 남음
                    </span>
                  </div>

                  <button className="w-full py-2.5 bg-[#22C55E] text-white rounded-full font-semibold text-sm hover:bg-[#4ADE80] transition-colors">
                    지금 리뷰하기 →
                  </button>
                </div>
              </Link>
            ))}
          </section>
        )}

        {/* 완료 */}
        {completedReviews.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#7B9DD4] mb-3 uppercase tracking-wide">
              완료된 리뷰
            </h2>
            <div className="space-y-3">
              {completedReviews.map((r) => (
                <div key={r.matchId} className="bg-[#1B2B5E] rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold">{r.date} {r.time}</p>
                      <p className="text-[#7B9DD4] text-sm mt-0.5">{r.place}</p>
                    </div>
                    <ReviewStatusBadge status="completed" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
