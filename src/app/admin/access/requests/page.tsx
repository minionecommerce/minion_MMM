import { requirePageAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FileText } from "lucide-react";
import { SAFE_USER_SELECT } from "@/lib/safe-select";

export default async function AccessRequestsPage() {
  await requirePageAccess(["users"]);
  const requests = await prisma.accessRequest.findMany({
    include: {
      employee: { include: { user: { select: SAFE_USER_SELECT } } },
      reviewedBy: { include: { user: { select: SAFE_USER_SELECT } } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1b1e] border border-[#292B30] rounded-xl overflow-hidden p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-yellow-500" />
          ACCESS REQUESTS
        </h2>
        
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No access requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111113] border-b border-[#292B30] text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Requested Access</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292B30]">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-[#292B30]/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{req.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-white">{req.employee.user.name}</td>
                    <td className="px-4 py-3 text-yellow-400">{req.requestedAccess}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        req.status === "PENDING" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        req.status === "APPROVED" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {req.status === "PENDING" && (
                        <>
                          <button className="px-3 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded transition-colors text-xs border border-green-500/20">
                            Approve
                          </button>
                          <button className="px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-colors text-xs border border-red-500/20">
                            Reject
                          </button>
                        </>
                      )}
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
