"use client";

import { useState } from "react";
import { ArrowLeft, Save, Users, Key, Activity, RotateCcw, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RoleDetailClient({
  role,
  allPermissions
}: {
  role: any;
  allPermissions: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Permissions");
  const [isSaving, setIsSaving] = useState(false);

  // Group permissions by module
  const modules = Array.from(new Set(allPermissions.map(p => p.module))).sort();
  const commonActions = ["VIEW", "CREATE", "EDIT", "DELETE", "ASSIGN", "APPROVE", "EXPORT", "UPLOAD", "DOWNLOAD", "SHARE", "MANAGE"];

  const initialPerms = role.permissions.reduce((acc: any, rp: any) => {
    acc[rp.permissionId] = rp;
    return acc;
  }, {});

  const [permissions, setPermissions] = useState<Record<string, any>>(initialPerms);

  const handleCellClick = (permId: string) => {
    setPermissions(prev => {
      const copy = { ...prev };
      if (copy[permId]) {
        // Toggle off
        delete copy[permId];
      } else {
        // Toggle on
        copy[permId] = { permissionId: permId, effect: "ALLOW", scope: "ALL" };
      }
      return copy;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/access/roles/${role.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: Object.values(permissions) })
      });
      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to save role permissions.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving permissions.");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#151619] border border-[#292B30] p-6 rounded-xl">
        <div className="flex gap-4">
          <Link href="/team/roles" className="mt-1 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-500" />
              {role.name}
            </h2>
            <p className="text-sm text-gray-400 mt-1 max-w-xl">{role.description || "No description provided."}</p>
            <div className="text-xs mt-3 flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full border ${
                role.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>
                {role.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
              <span className="text-gray-500" suppressHydrationWarning>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        {activeTab === "Permissions" && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Permissions"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#292B30]">
        {[
          { id: "Permissions", icon: Key },
          { id: "Employees", icon: Users },
          { id: "Audit", icon: Activity }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === t.id 
                  ? "border-yellow-500 text-yellow-500" 
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.id}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "Permissions" && (
        <div className="space-y-4">
          <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0D0D0F] border-b border-[#292B30] text-gray-400">
                <tr>
                  <th className="px-4 py-4 font-bold whitespace-nowrap sticky left-0 bg-[#0D0D0F] z-10 w-48">MODULE</th>
                  {commonActions.map(action => (
                    <th key={action} className="px-2 py-4 font-bold text-center whitespace-nowrap text-[11px] tracking-wider w-20">
                      {action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292B30]">
                {modules.map(mod => {
                  const modulePerms = allPermissions.filter(p => p.module === mod);
                  if (modulePerms.length === 0) return null;

                  return (
                    <tr key={mod} className="hover:bg-[#292B30]/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white sticky left-0 bg-[#151619] z-10 w-48 border-r border-[#292B30]">
                        {mod.toUpperCase()}
                      </td>
                      
                      {commonActions.map(action => {
                        const perm = modulePerms.find(p => p.action === action);
                        
                        if (!perm) {
                          return <td key={action} className="px-2 py-3 text-center bg-[#0D0D0F]/30 border-l border-[#292B30]/30"></td>;
                        }

                        const hasPerm = !!permissions[perm.id];

                        return (
                          <td key={action} className="px-2 py-3 text-center border-l border-[#292B30]/50">
                            <button 
                              onClick={() => handleCellClick(perm.id)}
                              className={`w-6 h-6 mx-auto rounded flex items-center justify-center transition-all ${
                                hasPerm ? "border border-yellow-500 bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/20" :
                                "border border-[#292B30] bg-[#0D0D0F] hover:border-gray-500 text-transparent hover:text-gray-500"
                              }`}
                              title={perm.description || `${action} ${mod}`}
                            >
                              ✓
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Employees" && (
        <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden p-6">
          <h3 className="text-lg font-bold text-white mb-4">Assigned Employees ({role.users.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {role.users.map((u: any) => (
              <div key={u.id} className="bg-[#0D0D0F] border border-[#292B30] p-4 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  {u.name?.charAt(0) || "U"}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.employee?.designation || "No Designation"}</div>
                </div>
              </div>
            ))}
            {role.users.length === 0 && (
              <p className="text-gray-500 text-sm col-span-3">No employees assigned to this role.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "Audit" && (
        <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden p-6 text-center text-gray-500 py-12">
          Audit history for this role will appear here.
        </div>
      )}
    </div>
  );
}
