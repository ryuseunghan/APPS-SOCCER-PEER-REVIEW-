"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import ClubBadge from "@/components/ClubBadge";

const tabs = [
  {
    href: "/home",
    label: "홈",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke={active ? "#22C55E" : "#7B9DD4"}
          strokeWidth="2"
          fill={active ? "rgba(34,197,94,0.15)" : "none"}
          strokeLinejoin="round"
        />
        <path
          d="M9 21V12h6v9"
          stroke={active ? "#22C55E" : "#7B9DD4"}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/matches",
    label: "경기",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke={active ? "#22C55E" : "#7B9DD4"} strokeWidth="2" />
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke={active ? "#22C55E" : "#7B9DD4"} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill={active ? "#22C55E" : "#7B9DD4"} />
      </svg>
    ),
  },
  {
    href: "/review",
    label: "리뷰",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          stroke={active ? "#22C55E" : "#7B9DD4"}
          strokeWidth="2"
          fill={active ? "rgba(34,197,94,0.15)" : "none"}
        />
      </svg>
    ),
  },
  {
    href: "/rankings",
    label: "랭킹",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M3 17h4v4H3zM10 11h4v10h-4zM17 7h4v14h-4z" stroke={active ? "#22C55E" : "#7B9DD4"} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "프로필",
    icon: (active: boolean) => (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" stroke={active ? "#22C55E" : "#7B9DD4"} strokeWidth="2" />
        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={active ? "#22C55E" : "#7B9DD4"} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function SideNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-[#1B2B5E] border-r border-[#243570] sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#243570]">
        <div className="flex items-center gap-3">
          <ClubBadge size={40} />
          <div>
            <p className="text-white font-bold text-base leading-tight">MatchRate</p>
            <p className="text-[#F59E0B] text-[10px] font-semibold">Happy Life FC</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? "bg-[#22C55E]/15 text-[#22C55E]"
                  : "text-[#7B9DD4] hover:bg-[#243570] hover:text-white"
              }`}
            >
              {tab.icon(active)}
              <span className={`text-sm font-medium ${active ? "text-[#22C55E]" : ""}`}>
                {tab.label}
              </span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — 유저 정보 + 로그아웃 */}
      <div className="px-4 py-4 border-t border-[#243570] space-y-3">
        {session?.user && (
          <div className="flex items-center gap-2.5">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? ""}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#243570] flex items-center justify-center text-[#7B9DD4] text-sm font-bold">
                {session.user.name?.[0] ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{session.user.name}</p>
              {session.user.email && (
                <p className="text-[#4B5563] text-[10px] truncate">{session.user.email}</p>
              )}
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#7B9DD4] hover:bg-[#243570] hover:text-white transition-all text-sm"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          로그아웃
        </button>
        <p className="text-[#4B5563] text-xs px-1">MatchRate v1.0</p>
      </div>
    </aside>
  );
}
