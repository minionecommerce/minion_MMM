'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Briefcase, Target, LayoutGrid, TreePine, CheckCircle2, Users, BookOpen, Gift, Library, Search, Bell, ChevronDown, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

const allNavItems = [
  { label: 'HOME', icon: Home, href: '/' },
  { label: 'MY WORK', icon: Briefcase, href: '/my-work' },
  { label: 'CRM', icon: Target, href: '/crm', requiredPermission: 'crm.view' },
  { label: 'PROJECTS', icon: LayoutGrid, href: '/projects', requiredPermission: 'projects.view' },
  { label: 'PARKS', icon: TreePine, href: '/parks', requiredPermission: 'parks.view' },
  { label: 'TASKS', icon: CheckCircle2, href: '/tasks', requiredPermission: 'tasks.view' },
  { label: 'TEAM', icon: Users, href: '/team', requiredPermission: 'team.view' },
  { label: 'LEARNING', icon: BookOpen, href: '/learning', requiredPermission: 'learning.view' },
  { label: 'REWARDS', icon: Gift, href: '/rewards', requiredPermission: 'rewards.view' },
  { label: 'RESOURCES', icon: Library, href: '/resources', requiredPermission: 'resources.view' },
];

export default function GlobalNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const permissions = session?.user?.permissions || [];
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const visibleNavItems = allNavItems.filter(item => {
    if (!item.requiredPermission) return true;
    if (isSuperAdmin) return true;
    return permissions.includes(item.requiredPermission);
  });

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  if (pathname === '/login' || pathname === '/unauthorized') {
    return null;
  }

  return (
    <nav className="w-full bg-[#111113] border-b border-[#292B30] px-6 h-20 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-12 h-full">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer Triangle */}
              <path d="M50 15L90 85H10L50 15Z" stroke="#FFCC00" strokeWidth="6" strokeLinejoin="round" />
              {/* Inner Triangle */}
              <path d="M50 35L75 78H25L50 35Z" stroke="#FFCC00" strokeWidth="6" strokeLinejoin="round" />
              {/* Bottom Line */}
              <path d="M10 95H90" stroke="#FFCC00" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[18px] font-bold leading-none text-white tracking-wide">MINION</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">SMART HOME SOLUTIONS</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-8 h-full">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative h-full flex flex-col items-center justify-center gap-1.5 min-w-[60px] group transition-colors ${
                  isActive ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-400' : 'text-gray-400 group-hover:text-gray-200'} transition-colors`} />
                <span className="text-[11px] font-bold tracking-wider">{item.label}</span>
                
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-yellow-400 rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Search Icon */}
        <button className="text-gray-400 hover:text-white transition-colors">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-[#111113] rounded-full"></span>
        </button>

        <div className="w-px h-8 bg-[#292B30] mx-2" />

        {/* Profile */}
        {session?.user ? (
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-full bg-[#3B2E15] flex items-center justify-center shrink-0">
                <span className="text-[13px] font-bold text-yellow-400">
                  {session.user.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col items-start hidden sm:flex">
                <span className="text-[10px] text-gray-400 font-medium leading-tight">
                  {session.user.role || 'User'}
                </span>
                <span className="text-[13px] font-bold text-white leading-tight">
                  {session.user.name || 'User'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors ml-1" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1b1e] border border-[#292B30] rounded-lg shadow-lg py-1 z-50">
                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#292B30] hover:text-white">
                  My Profile
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
          <Link href="/login" className="text-sm font-medium text-yellow-400 hover:text-yellow-300">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
