'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Briefcase, Target, LayoutGrid, TreePine, CheckCircle2, Users, UserCog, BookOpen, Gift, Library, Search, Bell, ChevronUp, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen, KeyRound, ClipboardList, type LucideIcon } from 'lucide-react';
import { NAV_ITEMS, snapshotCanViewAny } from '@/lib/rbac/catalog';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useSyncExternalStore } from 'react';

const NAV_ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/my-work": Briefcase,
  "/leads": ClipboardList,
  "/crm": Target,
  "/projects": LayoutGrid,
  "/parks": TreePine,
  "/tasks": CheckCircle2,
  "/team": Users,
  "/users": UserCog,
  "/learning": BookOpen,
  "/rewards": Gift,
  "/resources": Library,
};

// Desktop collapsed/expanded preference, kept in localStorage.
// Falls back to memory when storage is unavailable (private mode, blocked site data).
const COLLAPSED_KEY = 'minion.sidebar.collapsed';
const collapsedListeners = new Set<() => void>();
let collapsedMemory: boolean | null = null;

function getCollapsed() {
  if (collapsedMemory !== null) return collapsedMemory;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function setCollapsedPreference(value: boolean) {
  collapsedMemory = value;
  try {
    localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0');
  } catch {}
  collapsedListeners.forEach(listener => listener());
}

function subscribeCollapsed(listener: () => void) {
  collapsedListeners.add(listener);
  return () => {
    collapsedListeners.delete(listener);
  };
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 flex items-center justify-center shrink-0">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Triangle */}
          <path d="M50 15L90 85H10L50 15Z" stroke="#FFCC00" strokeWidth="6" strokeLinejoin="round" />
          {/* Inner Triangle */}
          <path d="M50 35L75 78H25L50 35Z" stroke="#FFCC00" strokeWidth="6" strokeLinejoin="round" />
          {/* Bottom Line */}
          <path d="M10 95H90" stroke="#FFCC00" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
      {!compact && (
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-[18px] font-bold leading-none text-white tracking-wide">MINION</span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1 truncate">SMART HOME SOLUTIONS</span>
        </div>
      )}
    </div>
  );
}

export default function GlobalNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsed, () => false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close the mobile drawer and profile menu after navigating
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
    setDropdownOpen(false);
  }

  const toggleCollapsed = () => setCollapsedPreference(!collapsed);

  const permissions = session?.user?.permissions || [];

  // UX only: the server enforces the same rules on every request
  const visibleNavItems = NAV_ITEMS
    .filter(item => snapshotCanViewAny(permissions, item.modules))
    .map(item => ({ ...item, icon: NAV_ICONS[item.href] ?? Home }));

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  // Session revoked on the server (deactivated, password reset, expired): sign out locally
  const sessionInvalid = !!session?.user?.invalid;
  useEffect(() => {
    if (sessionInvalid) {
      signOut({ redirect: false }).then(() => router.push('/login?expired=1'));
    }
  }, [sessionInvalid, router]);

  if (pathname === '/login' || pathname === '/unauthorized' || pathname === '/forgot-password' || pathname === '/account/change-password') {
    return null;
  }

  // The mobile drawer always shows labels; the desktop sidebar can collapse to icons
  const renderSidebarContent = (isCompact: boolean) => (
    <div className="flex flex-col h-full">
      {/* Logo + collapse toggle */}
      <div className={`h-20 flex items-center border-b border-[#292B30] shrink-0 ${isCompact ? 'justify-center px-2' : 'justify-between px-5'}`}>
        <Link href="/" aria-label="Minion home">
          <Logo compact={isCompact} />
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search + notifications */}
      <div className={`flex gap-2 px-3 pt-4 ${isCompact ? 'flex-col items-center' : 'items-center'}`}>
        <button
          className={`flex items-center gap-3 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1b1e] transition-colors ${isCompact ? 'p-2.5' : 'flex-1 px-3 py-2.5 bg-[#0D0D0F] border border-[#292B30]'}`}
          title="Search"
        >
          <Search className="w-4 h-4 shrink-0" />
          {!isCompact && <span className="text-[12px] font-medium">Search</span>}
        </button>
        <button className="relative p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1b1e] transition-colors" title="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-yellow-400 border-2 border-[#111113] rounded-full"></span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              title={isCompact ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 rounded-lg transition-colors group ${
                isCompact ? 'justify-center h-11' : 'px-3 h-11'
              } ${
                isActive ? 'bg-yellow-400/10 text-yellow-400' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1b1e]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-yellow-400 rounded-r-full" />
              )}
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-yellow-400' : 'text-gray-400 group-hover:text-gray-200'} transition-colors`} />
              {!isCompact && <span className="text-[12px] font-bold tracking-wider truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="border-t border-[#292B30] p-3 shrink-0">
        {session?.user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full flex items-center gap-3 rounded-lg p-2 hover:bg-[#1a1b1e] transition-colors group ${isCompact ? 'justify-center' : ''}`}
              title={isCompact ? session.user.name || 'User' : undefined}
            >
              <div className="w-9 h-9 rounded-full bg-[#3B2E15] flex items-center justify-center shrink-0">
                <span className="text-[13px] font-bold text-yellow-400">
                  {session.user.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              {!isCompact && (
                <>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-[10px] text-gray-400 font-medium leading-tight truncate max-w-full">
                      {session.user.role || 'User'}
                    </span>
                    <span className="text-[13px] font-bold text-white leading-tight truncate max-w-full">
                      {session.user.name || 'User'}
                    </span>
                  </div>
                  <ChevronUp className={`w-4 h-4 text-gray-500 group-hover:text-white transition-all ${dropdownOpen ? '' : 'rotate-180'}`} />
                </>
              )}
            </button>
            {dropdownOpen && (
              <div className={`absolute bottom-full mb-2 w-48 bg-[#1a1b1e] border border-[#292B30] rounded-lg shadow-lg py-1 z-50 ${isCompact ? 'left-0' : 'left-0 right-0 w-auto'}`}>
                <Link href="/account" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#292B30] hover:text-white">
                  My Profile
                </Link>
                <Link href="/account/change-password" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#292B30] hover:text-white">
                  <KeyRound className="w-4 h-4" />
                  Change Password
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#292B30] hover:text-red-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={`block text-sm font-medium text-yellow-400 hover:text-yellow-300 ${isCompact ? 'text-center' : 'px-2'}`}>
            Sign In
          </Link>
        )}

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className={`hidden lg:flex w-full items-center gap-3 mt-2 rounded-lg p-2 text-gray-500 hover:text-white hover:bg-[#1a1b1e] transition-colors ${isCompact ? 'justify-center' : ''}`}
          aria-label={isCompact ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCompact ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCompact ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          {!isCompact && <span className="text-[11px] font-semibold tracking-wider">COLLAPSE</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 h-16 bg-[#111113] border-b border-[#292B30] px-4 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-gray-300 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/" aria-label="Minion home">
          <Logo />
        </Link>
        <button className="relative text-gray-400 hover:text-white transition-colors" title="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-[#111113] rounded-full"></span>
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[#111113] border-r border-[#292B30] shadow-2xl">
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block sticky top-0 h-screen shrink-0 z-30 bg-[#111113] border-r border-[#292B30] transition-[width] duration-200 ${
          collapsed ? 'w-[76px]' : 'w-60'
        }`}
      >
        {renderSidebarContent(collapsed)}
      </aside>
    </>
  );
}
