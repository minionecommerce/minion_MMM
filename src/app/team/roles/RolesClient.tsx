"use client";

import { useState } from "react";
import { Plus, Search, Filter, Shield, MoreVertical, Edit2, Copy, Trash2, Power, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type RoleData = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count: {
    users: number;
    permissions: number;
  };
  createdAt: Date;
};

export default function RolesClient({ initialRoles }: { initialRoles: RoleData[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredRoles = initialRoles.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.description?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/access/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName, description: newRoleDesc })
      });

      if (res.ok) {
        setNewRoleName("");
        setNewRoleDesc("");
        setIsCreateOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create role");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white p-6">
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/team" className="text-gray-400 hover:text-yellow-400 transition-colors">
              <Shield className="w-5 h-5" />
            </Link>
            <h1 className="text-[28px] font-black tracking-tight text-white uppercase">Roles & Permissions</h1>
          </div>
          <p className="text-[13px] text-gray-400 max-w-xl font-medium">
            Manage application access levels, assign default permissions, and configure custom roles.
          </p>
        </div>

        {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search roles..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1b1e] border border-[#292B30] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#1a1b1e] border border-[#292B30] rounded-lg text-sm text-gray-300 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
        
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Roles Table */}
      <div className="bg-[#1a1b1e] border border-[#292B30] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111113] border-b border-[#292B30] text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Role Name</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Description</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-center">Employees</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-center">Permissions</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-center">Status</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292B30]">
              {filteredRoles.map((role) => (
                <tr key={role.id} className="hover:bg-[#292B30]/50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/team/roles/${role.id}`} className="flex items-center gap-3 hover:text-yellow-400 transition-colors group/link">
                      <div className="w-8 h-8 rounded-lg bg-[#292B30] flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-yellow-500" />
                      </div>
                      <span className="font-semibold text-white group-hover/link:text-yellow-400 transition-colors">{role.name}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-400 max-w-xs truncate">
                    {role.description || "No description"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-[#292B30] text-gray-300 text-xs font-medium">
                      {role._count.users}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                      {role._count.permissions}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      role.isActive 
                        ? "bg-green-500/10 text-green-400 border-green-500/20" 
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {role.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/team/roles/${role.id}`} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => {
                          setNewRoleName(`Copy of ${role.name}`);
                          setNewRoleDesc(role.description || "");
                          setIsCreateOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm(`Are you sure you want to ${role.isActive ? 'deactivate' : 'activate'} this role?`)) {
                            const res = await fetch(`/api/admin/access/roles/${role.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ isActive: !role.isActive })
                            });
                            if (res.ok) router.refresh();
                            else alert("Failed to update status");
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors" title={role.isActive ? "Deactivate" : "Activate"}>
                        <Power className="w-4 h-4" />
                      </button>
                      {role.name !== "SUPER_ADMIN" && (
                        <button 
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
                              const res = await fetch(`/api/admin/access/roles/${role.id}`, { method: "DELETE" });
                              if (res.ok) router.refresh();
                              else alert("Failed to delete role");
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No roles found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1b1e] border border-[#292B30] rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#292B30]">
              <h2 className="text-xl font-bold text-white">Create Custom Role</h2>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateRole} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role Name</label>
                <input 
                  type="text" 
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-[#111113] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="e.g. Sales Manager"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea 
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#111113] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  placeholder="Describe the access level for this role..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !newRoleName}
                  className="px-5 py-2 bg-yellow-500 text-black text-sm font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
