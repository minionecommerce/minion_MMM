'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Restore collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('minion_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleCollapse = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsed((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('minion_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Auth pages don't show the dashboard layout
  if (pathname === '/login' || pathname === '/unauthorized') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white flex">
      {/* Sidebar with Home to Resources navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sleek Top Header */}
        <TopHeader
          onOpenMobile={() => setIsMobileOpen(true)}
          isCollapsed={isCollapsed}
        />

        {/* Page Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
