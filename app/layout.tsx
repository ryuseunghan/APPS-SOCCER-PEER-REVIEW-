import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatchRate — 경기 후 30초, 팀원이 보는 내 진짜 레이팅",
  description: "동네 풋살·축구 동호회원이 경기 후 서로 평가하고 성장하는 피어리뷰 플랫폼",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0D1B3E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0D1B3E] text-white">
        {children}
      </body>
    </html>
  );
}
