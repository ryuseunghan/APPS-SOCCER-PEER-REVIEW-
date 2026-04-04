"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/home",
    label: "홈",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
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
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke={active ? "#22C55E" : "#7B9DD4"}
          strokeWidth="2"
        />
        <path
          d="M12 3v4M12 17v4M3 12h4M17 12h4"
          stroke={active ? "#22C55E" : "#7B9DD4"}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3" fill={active ? "#22C55E" : "#7B9DD4"} />
      </svg>
    ),
  },
  {
    href: "/review",
    label: "리뷰",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
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
    href: "/profile",
    label: "프로필",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke={active ? "#22C55E" : "#7B9DD4"}
          strokeWidth="2"
        />
        <path
          d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
          stroke={active ? "#22C55E" : "#7B9DD4"}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1B2B5E] border-t border-[#243570]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]"
            >
              {tab.icon(active)}
              <span
                className={`text-[11px] font-medium ${
                  active ? "text-[#22C55E]" : "text-[#7B9DD4]"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
