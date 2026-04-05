"use client";

// Design Ref: §6.2 — Client Component: useEffect로 /api/users 로드 후 멤버 목록 렌더
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import type { ClubMember } from "@/lib/queries/users";

export default function MatchRegisterForm() {
  const router = useRouter();

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [ourScore, setOurScore] = useState<string>("");
  const [opponentScore, setOpponentScore] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setMembers(data);
        setMembersLoading(false);
      })
      .catch(() => setMembersLoading(false));
  }, []);

  function toggleMember(id: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedMembers(new Set(members.map((m) => m.id)));
  }

  function clearAll() {
    setSelectedMembers(new Set());
  }

  function validate(): string {
    if (!date) return "날짜를 입력해주세요.";
    if (!place.trim()) return "장소를 입력해주세요.";
    if (selectedMembers.size === 0) return "참여 멤버를 1명 이상 선택해주세요.";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        time: time || "00:00",
        place,
        our_score: ourScore !== "" ? Number(ourScore) : null,
        opponent_score: opponentScore !== "" ? Number(opponentScore) : null,
        participant_ids: [...selectedMembers],
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "경기 등록에 실패했습니다.");
      return;
    }

    router.push("/matches");
  }

  const isWin =
    ourScore !== "" &&
    opponentScore !== "" &&
    Number(ourScore) > Number(opponentScore);
  const isDraw =
    ourScore !== "" &&
    opponentScore !== "" &&
    Number(ourScore) === Number(opponentScore);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-full bg-[#0D1B3E]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1B2B5E] lg:bg-[#0D1B3E]/80 lg:backdrop-blur-sm px-4 lg:px-8 py-4 flex items-center gap-3 border-b border-[#243570]">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[#7B9DD4] hover:text-white transition-colors"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-white">경기 등록</h1>
      </header>

      <div className="flex-1 px-4 lg:px-8 py-4 lg:py-6 overflow-y-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
          {/* 왼쪽: 경기 정보 + 스코어 */}
          <div className="space-y-6">
            {/* 날짜 / 시간 */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[#7B9DD4] uppercase tracking-wide">경기 정보</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#7B9DD4] mb-1 block">날짜 *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#1B2B5E] border border-[#243570] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#22C55E] transition-colors [color-scheme:dark]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#7B9DD4] mb-1 block">시간</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#1B2B5E] border border-[#243570] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#22C55E] transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#7B9DD4] mb-1 block">장소 *</label>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="예: 풋살파크 강남 B코트"
                  className="w-full bg-[#1B2B5E] border border-[#243570] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#22C55E] transition-colors placeholder:text-[#4B5563]"
                />
              </div>
            </section>

            {/* 스코어 */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[#7B9DD4] uppercase tracking-wide">최종 스코어 (선택)</h2>

              <div className="bg-[#1B2B5E] rounded-2xl p-4">
                <div className="flex items-center justify-center gap-4">
                  {/* 우리팀 */}
                  <div className="flex-1 text-center">
                    <p className="text-[#22C55E] text-xs font-semibold mb-2">우리팀</p>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={ourScore}
                      onChange={(e) => setOurScore(e.target.value)}
                      placeholder="0"
                      className="w-full text-center text-4xl font-bold bg-[#243570] border border-[#3B5CB8] rounded-xl py-3 text-white outline-none focus:border-[#22C55E] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[#7B9DD4] text-2xl font-bold">:</p>
                    {ourScore !== "" && opponentScore !== "" && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isWin
                            ? "bg-[#22C55E]/20 text-[#22C55E]"
                            : isDraw
                            ? "bg-[#EAB308]/20 text-[#EAB308]"
                            : "bg-[#EF4444]/20 text-[#EF4444]"
                        }`}
                      >
                        {isWin ? "승" : isDraw ? "무" : "패"}
                      </span>
                    )}
                  </div>

                  {/* 상대팀 */}
                  <div className="flex-1 text-center">
                    <p className="text-[#7B9DD4] text-xs font-semibold mb-2">상대팀</p>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={opponentScore}
                      onChange={(e) => setOpponentScore(e.target.value)}
                      placeholder="0"
                      className="w-full text-center text-4xl font-bold bg-[#243570] border border-[#3B5CB8] rounded-xl py-3 text-[#7B9DD4] outline-none focus:border-[#22C55E] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 오른쪽: 참여 멤버 선택 */}
          <div className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#7B9DD4] uppercase tracking-wide">
                  참여 멤버 *
                  <span className="ml-2 text-[#22C55E] normal-case font-medium">
                    {selectedMembers.size}명 선택
                  </span>
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-[#22C55E] font-medium hover:opacity-80"
                  >
                    전체
                  </button>
                  <span className="text-[#243570]">|</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-[#7B9DD4] font-medium hover:opacity-80"
                  >
                    초기화
                  </button>
                </div>
              </div>

              {membersLoading ? (
                <div className="text-center py-8">
                  <p className="text-[#7B9DD4] text-sm">멤버 목록 로딩 중...</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                  {members.map((member) => {
                    const selected = selectedMembers.has(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleMember(member.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                          selected
                            ? "bg-[#22C55E]/20 ring-2 ring-[#22C55E]"
                            : "bg-[#1B2B5E] hover:bg-[#243570]"
                        }`}
                      >
                        <Avatar
                          name={member.name}
                          size="lg"
                          isSelected={selected}
                        />
                        <div className="text-center">
                          <p className="text-white text-xs font-medium leading-tight">{member.name}</p>
                          <p className="text-[#7B9DD4] text-[10px]">{member.position ?? "-"}</p>
                        </div>
                        {selected && (
                          <span className="text-[#22C55E] text-[10px] font-bold">✓ 참여</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 선택 요약 */}
            {selectedMembers.size > 0 && (
              <div className="bg-[#1B2B5E] rounded-xl px-4 py-3">
                <p className="text-xs text-[#7B9DD4] mb-2">참여 멤버</p>
                <div className="flex flex-wrap gap-2">
                  {members.filter((m) => selectedMembers.has(m.id)).map((m) => (
                    <span
                      key={m.id}
                      className="px-2 py-0.5 bg-[#22C55E]/20 text-[#22C55E] rounded-full text-xs font-medium"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 에러 + 제출 버튼 */}
      <div className="px-4 lg:px-8 pt-3 pb-4 space-y-3 border-t border-[#243570] bg-[#0D1B3E]">
        {error && (
          <p className="text-[#EF4444] text-sm text-center">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full lg:max-w-sm lg:mx-auto py-4 bg-[#22C55E] text-white rounded-full font-bold text-base hover:bg-[#4ADE80] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              등록 중...
            </>
          ) : (
            "경기 등록 완료"
          )}
        </button>
      </div>
    </form>
  );
}
