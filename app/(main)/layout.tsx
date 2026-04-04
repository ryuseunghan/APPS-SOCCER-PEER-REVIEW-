import BottomNav from "@/components/BottomNav";
import SideNav from "@/components/SideNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* 사이드바: lg 이상에서만 표시 */}
      <SideNav />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
        {/* Bottom nav: lg 미만에서만 표시 */}
        <BottomNav />
      </div>
    </div>
  );
}
