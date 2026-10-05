import { requirePageAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Key } from "lucide-react";

export default async function PermissionsPage() {
  await requirePageAccess(["users"]);
  const permissions = await prisma.permission.findMany({
    where: { isLegacy: false },
    orderBy: [
      { module: "asc" },
      { action: "asc" }
    ]
  });

  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, typeof permissions>);

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1b1e] border border-[#292B30] rounded-xl overflow-hidden p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-yellow-500" />
          AVAILABLE PERMISSIONS
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module} className="bg-[#111113] border border-[#292B30] rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">{module}</h3>
              <ul className="space-y-3">
                {perms.map(p => (
                  <li key={p.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 font-medium">{p.action}</span>
                    <span className="text-gray-500 text-xs">{p.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
