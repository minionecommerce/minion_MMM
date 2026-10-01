import { requirePageAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Activity } from "lucide-react";
import { SAFE_USER_SELECT } from "@/lib/safe-select";

export default async function AuditLogPage() {
  await requirePageAccess(["users"]);
  const logs = await prisma.accessAuditLog.findMany({
    include: {
      employee: { include: { user: { select: SAFE_USER_SELECT } } },
      changedBy: { include: { user: { select: SAFE_USER_SELECT } } }
    },
    orderBy: { createdAt: "desc" },
    take: 100 // Limit for now
  });

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1b1e] border border-[#292B30] rounded-xl overflow-hidden p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-yellow-500" />
          ACCESS AUDIT LOG
        </h2>
        
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111113] border-b border-[#292B30] text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Date & Time</th>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Changed By</th>
                  <th className="px-4 py-3 font-medium">Module / Action</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292B30]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#292B30]/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400">
                      {log.createdAt.toLocaleDateString()} {log.createdAt.toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{log.employee.user.name}</td>
                    <td className="px-4 py-3 text-gray-400">{log.changedBy?.user.name || "System"}</td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-400 font-medium">{log.module}</span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className="text-gray-300">{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate" title={log.reason || ""}>
                      {log.reason || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
