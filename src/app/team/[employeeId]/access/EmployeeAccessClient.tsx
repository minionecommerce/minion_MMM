"use client";

import { useState } from "react";
import { ArrowLeft, Save, AlertCircle, ShieldAlert, History, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Permission = { id: string; module: string; action: string; description: string | null };
type RolePermission = { permissionId: string; effect: string; scope: string | null };
type EmployeeOverride = { permissionId: string; effect: string; scope: string | null; id: string };

export default function EmployeeAccessClient({
  employee,
  allPermissions,
  rolePermissions,
}: {
  employee: any;
  allPermissions: Permission[];
  rolePermissions: RolePermission[];
}) {
  const router = useRouter();
  
  // Group permissions by module
  const modules = Array.from(new Set(allPermissions.map(p => p.module))).sort();
  const commonActions = ["VIEW", "CREATE", "EDIT", "DELETE", "ASSIGN", "APPROVE", "EXPORT", "UPLOAD", "DOWNLOAD", "SHARE", "MANAGE"];

  // Current working state for overrides
  const [overrides, setOverrides] = useState<Record<string, EmployeeOverride>>(
    employee.permissionOverrides.reduce((acc: any, op: any) => {
      acc[op.permissionId] = op;
      return acc;
    }, {})
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleCellClick = (permId: string) => {
    const roleP = rolePermissions.find(rp => rp.permissionId === permId);
    const currentOverride = overrides[permId];

    let nextState: EmployeeOverride | null = null;

    if (roleP?.effect === "ALLOW") {
      if (!currentOverride) {
        nextState = { permissionId: permId, effect: "DENY", scope: "ALL", id: "new" };
      } else if (currentOverride.effect === "DENY") {
        nextState = null;
      }
    } else {
      if (!currentOverride) {
        nextState = { permissionId: permId, effect: "ALLOW", scope: "ALL", id: "new" };
      } else if (currentOverride.effect === "ALLOW") {
        nextState = null;
      }
    }

    setOverrides(prev => {
      const copy = { ...prev };
      if (nextState) {
        copy[permId] = nextState;
      } else {
        delete copy[permId];
      }
      return copy;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/access/employees/${employee.id}/overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: Object.values(overrides) })
      });
      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to save overrides.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving overrides.");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#1a1b1e] border border-[#292B30] p-6 rounded-xl">
        <div className="flex gap-4">
          <Link href={`/team/${employee.id}`} className="mt-1 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">{employee.user.name}</h2>
            <div className="text-sm text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-2">
              <span><strong className="text-gray-300">ID:</strong> {employee.id.slice(-6).toUpperCase()}</span>
              <span><strong className="text-gray-300">Dept:</strong> {employee.departmentRef?.name || employee.department || "N/A"}</span>
              <span><strong className="text-gray-300">Designation:</strong> {employee.designation || "N/A"}</span>
              <span><strong className="text-gray-300">Role:</strong> <span className="text-yellow-400">{employee.user.role?.name || "None"}</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setOverrides({})}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#292B30] text-gray-300 rounded-lg hover:bg-[#3B2E15] hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Access"}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-4 h-4 rounded border border-gray-600 bg-[#292B30] flex items-center justify-center text-[10px] text-gray-400">✓</div>
          <span>Inherited Allow</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-4 h-4 rounded border border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center text-[10px] text-yellow-400">✓</div>
          <span>Override Allow</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-4 h-4 rounded border border-red-500/50 bg-red-500/10 flex items-center justify-center text-[10px] text-red-400">✗</div>
          <span>Override Deny</span>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-[#1a1b1e] border border-[#292B30] rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111113] border-b border-[#292B30] text-gray-400">
            <tr>
              <th className="px-4 py-4 font-bold whitespace-nowrap sticky left-0 bg-[#111113] z-10 w-48">MODULE</th>
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
                  <td className="px-4 py-3 font-semibold text-white sticky left-0 bg-[#1a1b1e] z-10 w-48 border-r border-[#292B30]">
                    {mod.toUpperCase()}
                  </td>
                  
                  {commonActions.map(action => {
                    const perm = modulePerms.find(p => p.action === action);
                    
                    if (!perm) {
                      return <td key={action} className="px-2 py-3 text-center bg-[#111113]/30 border-l border-[#292B30]/30"></td>;
                    }

                    const roleP = rolePermissions.find(rp => rp.permissionId === perm.id);
                    const overrideP = overrides[perm.id];
                    
                    let cellState = "none";
                    if (overrideP) {
                      cellState = overrideP.effect === "ALLOW" ? "override-allow" : "override-deny";
                    } else if (roleP?.effect === "ALLOW") {
                      cellState = "inherited-allow";
                    }

                    return (
                      <td key={action} className="px-2 py-3 text-center border-l border-[#292B30]/50">
                        <button 
                          onClick={() => handleCellClick(perm.id)}
                          className={`w-6 h-6 mx-auto rounded flex items-center justify-center transition-all ${
                            cellState === "inherited-allow" ? "border border-gray-600 bg-[#292B30] text-gray-400" :
                            cellState === "override-allow" ? "border border-yellow-500 bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/20" :
                            cellState === "override-deny" ? "border border-red-500 bg-red-500/20 text-red-400 ring-2 ring-red-500/20" :
                            "border border-[#292B30] bg-[#111113] hover:border-gray-600 text-transparent hover:text-gray-600"
                          }`}
                          title={perm.description || `${action} ${mod}`}
                        >
                          {cellState === "override-deny" ? "✗" : "✓"}
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
  );
}
