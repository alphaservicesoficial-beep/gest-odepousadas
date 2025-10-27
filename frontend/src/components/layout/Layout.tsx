import { ReactNode, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type LayoutProps = {
  children?: ReactNode;
};

export function AppLayout({ children }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 0,
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const content = children ?? <Outlet />;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = useMemo(() => viewportWidth < 768, [viewportWidth]);
  const isTablet = useMemo(
    () => viewportWidth >= 768 && viewportWidth < 1024,
    [viewportWidth],
  );

  useEffect(() => {
    if (!isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(false);
      return;
    }
    setIsSidebarCollapsed(isTablet);
  }, [isMobile, isTablet]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = isMobileSidebarOpen
      ? "hidden"
      : originalOverflow;
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobile, isMobileSidebarOpen]);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {!isMobile && (
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      )}
      <div className="flex flex-1 flex-col">
        <Topbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 transition-colors dark:bg-slate-900">
          {content}
        </main>
      </div>
      {isMobile && (
        <Sidebar
          variant="mobile"
          collapsed={false}
          onToggle={() => setIsMobileSidebarOpen(false)}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default AppLayout;
