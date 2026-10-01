'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Shield, Activity } from 'lucide-react';

const TABS = [
  { href: '/users', label: 'Users', icon: Users, exact: true },
  { href: '/users/roles', label: 'Roles', icon: Shield },
  { href: '/users/audit', label: 'Audit Log', icon: Activity },
];

export function UsersNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-6 border-b border-[#292B30]" aria-label="User management">
      {TABS.map(t => {
        const active = t.exact
          ? !pathname.startsWith('/users/roles') && !pathname.startsWith('/users/audit')
          : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} className={`flex items-center gap-2 py-3 -mb-px border-b-2 text-[13px] font-semibold transition-colors ${active ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            <Icon className="w-4 h-4" /> {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PageShell({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white p-4 sm:p-6">
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-yellow-400">ADMINISTRATION</div>
            <h1 className="text-[26px] font-black tracking-tight uppercase">{title}</h1>
            {subtitle && <p className="text-[13px] text-gray-400 mt-1 max-w-2xl">{subtitle}</p>}
          </div>
          {actions}
        </div>
        <UsersNav />
        {children}
      </div>
    </div>
  );
}
