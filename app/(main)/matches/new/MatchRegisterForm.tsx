"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

// Happy Life FC 전체 멤버 목록
const CLUB_MEMBERS = [
  { id: "1", name: "김민준", position: "MF" },
  { id: "2", name: "이수진", position: "FW" },
  { id: "3", name: "박정훈", position: "DF" },
  { id: "4", name: "최재원", position: "GK" },
  { id: "5", name: "홍현우", position: "MF" },
  { id: "6", name: "박준혁", position: "FW" },
  { id: "7", name: "최서연", position: "MF" },
  { id: "8", name: "홍태양", position: "DF" },
  { id: "9", name: "김민서", position: "MF" },
  { id: "10", name: "도현우", position: "GK" },
];

export default function MatchRegisterForm() {
  const router = useRouter();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [ourScore, setOurScore] = useState<string>("");
  const [opponentScore, setOpponentScore] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    setSelectedMembers(new Set(CLUB_MEMBERS.map((m) => m.id)));
  }

  function clearAll() {
    setSelectedMembers(new Set());
  }

  function validate(): string {
    if (!date) return "날짜를 입력해주세요.";
    if (!place.trim()) return "장소를 입력해주세요.";
    if (ourScore === "" || opponentScore === "") return "스코어를 입력해주세요.";
    if (isNaN(Number(ourScore)) || isNaN(Number(opponentScore))) return "스코어는 숫자로 입력해주세요.";
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

    // TODO: API 연동 시 여기에 POST 요청 추가
    await new Promise((r) => setTimeout(r, 600)); // mock delay

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
      <header className="sticky top-0 z-10 bg-[#1B2B5E] px-4 py-4 flex items-center gap-3 border-b border-[#243570]">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[#7B9DD4] hover:text-white transition-colors"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-white">경기 등록</h1>
      </header>

      <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
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
          <h2 className="text-sm font-semibold text-[#7B9DD4] uppercase tracking-wide">최종 스코어 *</h2>

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

        {/* 참여 멤버 선택 */}
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

          <div className="grid grid-cols-3 gap-3">
            {CLUB_MEMBERS.map((member) => {
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
                    <p className="text-[#7B9DD4] text-[10px]">{member.position}</p>
                  </div>
                  {selected && (
                    <span className="text-[#22C55E] text-[10px] font-bold">✓ 참여</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 선택 요약 */}
        {selectedMembers.size > 0 && (
          <div className="bg-[#1B2B5E] rounded-xl px-4 py-3">
            <p className="text-xs text-[#7B9DD4] mb-2">참여 멤버</p>
            <div className="flex flex-wrap gap-2">
              {CLUB_MEMBERS.filter((m) => selectedMembers.has(m.id)).map((m) => (
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

      {/* 에러 + 제출 버튼 */}
      <div className="px-4 pt-3 pb-4 space-y-3 border-t border-[#243570] bg-[#0D1B3E]">
        {error && (
          <p className="text-[#EF4444] text-sm text-center">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-[#22C55E] text-white rounded-full font-bold text-base hover:bg-[#4ADE80] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
