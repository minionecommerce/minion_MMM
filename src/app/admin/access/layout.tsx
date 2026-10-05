import Link from "next/link";
import { Shield, Users, Key, FileText, Activity } from "lucide-react";
import { requirePageAccess } from "@/lib/auth";

export default async function AccessLayout({ children }: { children: React.ReactNode }) {
  // Only highly authorized users
  await requirePageAccess(["users"]);

  const tabs = [
    { name: "Users", href: "/users", icon: Users },
    { name: "Roles", href: "/users/roles", icon: Shield },
    { name: "Permissions", href: "/admin/access/permissions", icon: Key },
    { name: "Access Requests", href: "/admin/access/requests", icon: FileText },
    { name: "Legacy Audit Log", href: "/admin/access/audit", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#111113] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">ACCESS CONTROL</h1>
          <p className="text-gray-400 text-sm mt-1">Manage roles, employee access, and permissions.</p>
        </div>

        <div className="border-b border-[#292B30]">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className="group inline-flex items-center gap-2 border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-400 hover:border-gray-300 hover:text-gray-300"
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
