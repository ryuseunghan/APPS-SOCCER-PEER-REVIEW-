"use client";

// Design Ref: §6.3 — Client Component: 참가자 fetch + POST /api/reviews
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import RatingStar from "@/components/RatingStar";
import type { ClubMember } from "@/lib/queries/users";

interface PlayerRating {
  skill: number;
  stamina: number;
  teamplay: number;
  comment: string;
}

type Step = "intro" | "review" | "mvp" | "result";

export default function ReviewFlow({ matchId }: { matchId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const myId = session?.user?.id ?? null;

  const [players, setPlayers] = useState<ClubMember[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [step, setStep] = useState<Step>("intro");
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [ratings, setRatings] = useState<Record<string, PlayerRating>>({});
  const [selectedMvp, setSelectedMvp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`/api/matches/${matchId}/participants`)
      .then((r) => r.json())
      .then((data: ClubMember[]) => {
        setPlayers(data);
        setPlayersLoading(false);
      })
      .catch(() => setPlayersLoading(false));
  }, [matchId]);

  // 자기 자신 제외한 리뷰 대상
  const reviewablePlayers = players.filter((p) => p.id !== myId);
  const currentPlayer = reviewablePlayers[currentPlayerIdx];
  const currentRating = currentPlayer
    ? ratings[currentPlayer.id] ?? { skill: 0, stamina: 0, teamplay: 0, comment: "" }
    : { skill: 0, stamina: 0, teamplay: 0, comment: "" };

  function updateRating(field: keyof PlayerRating, value: number | string) {
    if (!currentPlayer) return;
    setRatings((prev) => ({
      ...prev,
      [currentPlayer.id]: {
        skill: prev[currentPlayer.id]?.skill ?? 0,
        stamina: prev[currentPlayer.id]?.stamina ?? 0,
        teamplay: prev[currentPlayer.id]?.teamplay ?? 0,
        comment: prev[currentPlayer.id]?.comment ?? "",
        [field]: value,
      },
    }));
  }

  function goNext() {
    if (currentPlayerIdx < reviewablePlayers.length - 1) {
      setCurrentPlayerIdx((i) => i + 1);
    } else {
      setStep("mvp");
    }
  }

  function goPrev() {
    if (currentPlayerIdx > 0) setCurrentPlayerIdx((i) => i - 1);
  }

  async function handleSubmitReviews() {
    setSubmitting(true);
    setSubmitError("");

    const reviewsPayload = reviewablePlayers
      .filter((p) => ratings[p.id]?.skill > 0)
      .map((p) => ({
        reviewee_id: p.id,
        skill: ratings[p.id].skill,
        stamina: ratings[p.id].stamina,
        teamplay: ratings[p.id].teamplay,
        comment: ratings[p.id].comment || undefined,
      }));

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match_id: matchId,
        reviews: reviewsPayload,
        mvp_vote: selectedMvp ?? undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setSubmitError(data.error ?? "리뷰 제출에 실패했습니다.");
      return;
    }

    setStep("result");
  }

  // ── Step: INTRO ─────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D1B3E] px-6 lg:px-0 py-8 lg:items-center lg:justify-center">
        <div className="w-full lg:max-w-md lg:mx-auto">
          <button
            onClick={() => router.back()}
            className="self-start mb-6 text-[#7B9DD4] flex items-center gap-1"
          >
            ← 경기 리뷰
          </button>

          <div className="flex flex-col justify-center items-center text-center gap-8">
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">오늘 경기 어땠나요?</p>
              <p className="text-[#7B9DD4]">팀원들에게 솔직한 피드백을 남겨주세요.</p>
            </div>

            <div className="bg-[#1B2B5E] rounded-2xl px-6 py-4 flex items-center gap-3">
              <span className="text-2xl">⏱</span>
              <p className="text-[#22C55E] font-semibold">30초이면 충분해요</p>
            </div>

            {playersLoading ? (
              <p className="text-[#7B9DD4] text-sm">참가자 목록 로딩 중...</p>
            ) : (
              <button
                onClick={() => setStep("review")}
                disabled={reviewablePlayers.length === 0}
                className="w-full py-4 bg-[#22C55E] text-white rounded-full font-bold text-lg hover:bg-[#4ADE80] transition-colors disabled:opacity-50"
              >
                지금 시작하기 →
              </button>
            )}

            <p className="text-[#7B9DD4] text-sm">(익명으로 진행됩니다)</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: REVIEW ────────────────────────────────────
  if (step === "review" && currentPlayer) {
    const progress = currentPlayerIdx + 1;
    const total = reviewablePlayers.length;
    const pct = Math.round((progress / total) * 100);

    return (
      <div className="flex flex-col min-h-screen bg-[#0D1B3E] lg:items-center">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D1B3E] px-4 lg:px-0 pt-4 pb-3 space-y-3 w-full lg:max-w-md">
          <div className="flex items-center justify-between">
            <button onClick={() => setStep("intro")} className="text-[#7B9DD4] text-sm">
              ←
            </button>
            <span className="text-white font-semibold text-sm">
              {progress}/{total} 리뷰 중
            </span>
            <div className="w-6" />
          </div>
          <div className="w-full h-1.5 bg-[#243570] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#22C55E] rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-4 lg:px-0 py-4 overflow-y-auto w-full lg:max-w-md">
          {/* Player Card */}
          <div className="bg-[#1B2B5E] rounded-2xl p-5 space-y-5">
            <div className="flex flex-col items-center gap-2">
              <Avatar name={currentPlayer.name} size="xl" />
              <div className="text-center">
                <p className="text-white font-bold text-lg">{currentPlayer.name}</p>
                <p className="text-[#7B9DD4] text-sm">{currentPlayer.position ?? "-"}</p>
              </div>
            </div>

            {(
              [
                { label: "경기력", field: "skill" as const },
                { label: "체  력", field: "stamina" as const },
                { label: "팀플레이", field: "teamplay" as const },
              ] as const
            ).map(({ label, field }) => (
              <div key={field} className="flex items-center justify-between">
                <span className="text-white font-medium w-20">{label}</span>
                <RatingStar
                  value={currentRating[field]}
                  size="md"
                  interactive
                  onChange={(v) => updateRating(field, v)}
                />
              </div>
            ))}

            <div>
              <p className="text-[#7B9DD4] text-sm mb-2">💬 한마디 (선택)</p>
              <textarea
                className="w-full bg-[#243570] text-white rounded-xl px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-[#22C55E] placeholder:text-[#4B5563]"
                rows={2}
                maxLength={50}
                placeholder="패스 타이밍이 정말 좋아요"
                value={currentRating.comment}
                onChange={(e) => updateRating("comment", e.target.value)}
              />
              <p className="text-right text-xs text-[#4B5563] mt-1">
                {currentRating.comment.length}/50
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={goPrev}
              disabled={currentPlayerIdx === 0}
              className="flex-1 py-3 rounded-full border border-[#243570] text-[#7B9DD4] font-semibold disabled:opacity-30 hover:border-[#3B5CB8] transition-colors"
            >
              ← 이전
            </button>
            <button
              onClick={goNext}
              className="flex-2 flex-grow-[2] py-3 bg-[#22C55E] text-white rounded-full font-bold hover:bg-[#4ADE80] transition-colors"
            >
              {currentPlayerIdx === reviewablePlayers.length - 1 ? "MVP 투표 →" : "다음 →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: MVP ────────────────────────────────────────
  if (step === "mvp") {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D1B3E] px-4 lg:px-0 py-8 lg:items-center lg:justify-center">
        <div className="w-full lg:max-w-md">
          <div className="text-center mb-8 space-y-2">
            <p className="text-2xl font-bold text-white">MVP를 뽑아주세요!</p>
            <p className="text-[#7B9DD4]">오늘 가장 빛났던 선수</p>
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {players.map((p) => {
              const isSelf = p.id === myId;
              const isSelected = selectedMvp === p.id;
              return (
                <button
                  key={p.id}
                  disabled={isSelf}
                  onClick={() => !isSelf && setSelectedMvp(isSelected ? null : p.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    isSelected
                      ? "bg-[#22C55E]/20 ring-2 ring-[#22C55E]"
                      : isSelf
                      ? "opacity-30 cursor-not-allowed"
                      : "bg-[#1B2B5E] hover:bg-[#243570]"
                  }`}
                >
                  <Avatar
                    name={p.name}
                    size="lg"
                    isDisabled={isSelf}
                    isSelected={isSelected}
                  />
                  <span className="text-white text-xs font-medium">{p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-[#1B2B5E] rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
            <span className="text-[#7B9DD4] text-sm">선택:</span>
            <span className={`font-semibold ${selectedMvp ? "text-[#22C55E]" : "text-[#7B9DD4]"}`}>
              {selectedMvp
                ? players.find((p) => p.id === selectedMvp)?.name ?? "선택됨"
                : "없음"}
            </span>
          </div>

          {submitError && (
            <p className="text-red-400 text-sm text-center mb-4">{submitError}</p>
          )}

          <button
            onClick={handleSubmitReviews}
            disabled={submitting}
            className="w-full py-4 bg-[#22C55E] text-white rounded-full font-bold text-base hover:bg-[#4ADE80] transition-colors disabled:opacity-50"
          >
            {submitting ? "제출 중..." : "투표 완료 →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Step: RESULT ─────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E] py-12 items-center justify-center text-center gap-8">
      <div className="w-full max-w-sm px-4">
        <div className="text-6xl animate-bounce mb-2">🎉</div>

        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-bold text-white">리뷰 완료!</h2>
          <p className="text-[#7B9DD4]">팀원 {reviewablePlayers.length}명에 대한 리뷰를 남겼어요</p>
        </div>

        <div className="w-full bg-[#1B2B5E] rounded-2xl p-6 space-y-4 mb-6">
          <p className="text-[#7B9DD4] text-sm">리뷰가 모이면 내 레이팅이 업데이트됩니다</p>
          <p className="text-white text-2xl font-bold">프로필에서 확인하세요</p>
        </div>

        <button className="w-full py-4 bg-[#22C55E] text-white rounded-full font-bold text-base flex items-center justify-center gap-2 hover:bg-[#4ADE80] transition-colors mb-4">
          <span>📤</span> 내 스탯 공유
        </button>

        <button
          onClick={() => router.push("/home")}
          className="text-[#7B9DD4] text-sm underline underline-offset-2"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
