"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import RatingStar from "@/components/RatingStar";

const PLAYERS = [
  { id: "1", name: "김민준", position: "MF", team: "A", gamesPlayed: 12 },
  { id: "2", name: "이수진", position: "FW", team: "A", gamesPlayed: 8 },
  { id: "3", name: "박정훈", position: "DF", team: "A", gamesPlayed: 15 },
  { id: "4", name: "최재원", position: "GK", team: "A", gamesPlayed: 6 },
  { id: "5", name: "홍현우", position: "MF", team: "A", gamesPlayed: 10 },
  { id: "6", name: "박준혁", position: "FW", team: "B", gamesPlayed: 9 },
  { id: "7", name: "최서연", position: "MF", team: "B", gamesPlayed: 11 },
  { id: "8", name: "홍태양", position: "DF", team: "B", gamesPlayed: 7 },
  { id: "9", name: "김민서", position: "MF", team: "B", gamesPlayed: 14 },
];

const MY_ID = "3"; // 자신 제외

interface PlayerRating {
  skill: number;
  stamina: number;
  teamplay: number;
  comment: string;
}

type Step = "intro" | "review" | "mvp" | "result";

export default function ReviewFlow({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [ratings, setRatings] = useState<Record<string, PlayerRating>>({});
  const [selectedMvp, setSelectedMvp] = useState<string | null>(null);

  const reviewablePlayers = PLAYERS.filter((p) => p.id !== MY_ID);
  const currentPlayer = reviewablePlayers[currentPlayerIdx];
  const currentRating = ratings[currentPlayer?.id] ?? {
    skill: 0,
    stamina: 0,
    teamplay: 0,
    comment: "",
  };

  function updateRating(field: keyof PlayerRating, value: number | string) {
    if (!currentPlayer) return;
    setRatings((prev) => ({
      ...prev,
      [currentPlayer.id]: {
        ...prev[currentPlayer.id],
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

            <button
              onClick={() => setStep("review")}
              className="w-full py-4 bg-[#22C55E] text-white rounded-full font-bold text-lg hover:bg-[#4ADE80] transition-colors"
            >
              지금 시작하기 →
            </button>

            <p className="text-[#7B9DD4] text-sm">(익명으로 진행됩니다)</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: REVIEW ────────────────────────────────────
  if (step === "review") {
    const progress = currentPlayerIdx + 1;
    const total = reviewablePlayers.length;
    const pct = Math.round((progress / total) * 100);
    const teamAPlayers = reviewablePlayers.filter((p) => p.team === "A");
    const teamBPlayers = reviewablePlayers.filter((p) => p.team === "B");
    const currentTeam = currentPlayer.team;

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
          {/* Team tag */}
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 rounded-full bg-[#243570] text-[#7B9DD4] text-xs font-semibold">
              팀 {currentTeam}
            </span>
          </div>

          {/* Player Card */}
          <div className="bg-[#1B2B5E] rounded-2xl p-5 space-y-5 swipe-card">
            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-2">
              <Avatar name={currentPlayer.name} size="xl" />
              <div className="text-center">
                <p className="text-white font-bold text-lg">{currentPlayer.name}</p>
                <p className="text-[#7B9DD4] text-sm">
                  {currentPlayer.position} · 경기 {currentPlayer.gamesPlayed}회
                </p>
              </div>
            </div>

            {/* Rating rows */}
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

            {/* Optional comment */}
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

          {/* Navigation */}
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
          {PLAYERS.map((p) => {
            const isSelf = p.id === MY_ID;
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
              ? PLAYERS.find((p) => p.id === selectedMvp)?.name
              : "없음"}
          </span>
        </div>

        <button
          onClick={() => setStep("result")}
          className="w-full py-4 bg-[#22C55E] text-white rounded-full font-bold text-base hover:bg-[#4ADE80] transition-colors"
        >
          투표 완료 →
        </button>
        </div>
      </div>
    );
  }

  // ── Step: RESULT ─────────────────────────────────────
  const myRatings = [4.3, 4.5, 3.8, 4.6]; // mock: [overall, skill, stamina, teamplay]

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E] py-12 items-center justify-center text-center gap-8">
      <div className="w-full max-w-sm px-4">
        <div className="text-6xl animate-bounce mb-2">🎉</div>

        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-bold text-white">리뷰 완료!</h2>
          <p className="text-[#7B9DD4]">팀원 9명 중 7명이 이미 리뷰를 남겼어요</p>
        </div>

        {/* Result card */}
        <div className="w-full bg-[#1B2B5E] rounded-2xl p-6 space-y-4 animate-count-up animate-glow mb-6">
          <p className="text-[#7B9DD4] text-sm">내 이번 경기 레이팅</p>

          <div className="flex flex-col items-center gap-1">
            <span className="text-5xl font-bold text-[#22C55E]">
              ★ {myRatings[0]}
            </span>
          </div>

          <div className="flex justify-around pt-2 border-t border-[#243570]">
            {["경기력", "체력", "태도"].map((label, i) => (
              <div key={label} className="text-center">
                <p className="text-[#7B9DD4] text-xs mb-1">{label}</p>
                <p className="text-white font-bold">{myRatings[i + 1]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Share CTA */}
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
