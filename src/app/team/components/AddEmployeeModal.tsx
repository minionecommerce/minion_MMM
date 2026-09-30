"use client";

import { useState } from "react";
import { X, Check, ChevronRight, User, Key, Shield, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddEmployeeModal({ 
  departments, 
  managers, 
  roles, 
  allPermissions,
  onClose 
}: { 
  departments: any[]; 
  managers: any[]; 
  roles: any[]; 
  allPermissions: any[];
  onClose: () => void 
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "", // Primary contact email
    phone: "",
    departmentId: "",
    designation: "",
    reportingManagerId: "",
    joiningDate: new Date().toISOString().split('T')[0],
    
    // Login
    loginEmail: "",
    password: "",
    confirmPassword: "",
    roleId: "",
  });

  const [overrides, setOverrides] = useState<Record<string, any>>({});

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const selectedRole = roles.find(r => r.id === formData.roleId);

  const toggleOverride = (permId: string) => {
    setOverrides(prev => {
      const copy = { ...prev };
      const rolePerm = selectedRole?.permissions.find((rp: any) => rp.permissionId === permId);
      const current = copy[permId];
      
      let nextState = null;
      if (rolePerm?.effect === "ALLOW") {
        if (!current) nextState = { permissionId: permId, effect: "DENY", scope: "ALL" };
        else if (current.effect === "DENY") nextState = null;
      } else {
        if (!current) nextState = { permissionId: permId, effect: "ALLOW", scope: "ALL" };
        else if (current.effect === "ALLOW") nextState = null;
      }

      if (nextState) copy[permId] = nextState;
      else delete copy[permId];
      
      return copy;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/team/employee-create-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          overrides: Object.values(overrides)
        })
      });

      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create employee");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modules = Array.from(new Set(allPermissions.map(p => p.module))).sort();
  const commonActions = ["VIEW", "CREATE", "EDIT", "DELETE", "ASSIGN", "APPROVE", "EXPORT", "UPLOAD", "DOWNLOAD", "SHARE", "MANAGE"];

  const isStep1Valid = formData.fullName && formData.designation;
  const isStep2Valid = formData.loginEmail && formData.password && formData.password === formData.confirmPassword && formData.roleId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#111113] border border-[#292B30] rounded-xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#292B30] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">ADD NEW EMPLOYEE</h2>
            <p className="text-sm text-gray-500 mt-1">Complete workflow for employee, login, and access creation.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#1a1b1e]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex border-b border-[#292B30] bg-[#151619] shrink-0 overflow-x-auto">
          {[
            { id: 1, label: "Info", icon: User },
            { id: 2, label: "Login & Role", icon: Key },
            { id: 3, label: "Access", icon: Shield },
            { id: 4, label: "Review", icon: FileText }
          ].map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isPast = step > s.id;
            return (
              <div key={s.id} className={`flex-1 flex items-center justify-center p-4 min-w-[150px] transition-colors border-b-2 ${
                isActive ? "border-yellow-500 bg-yellow-500/5 text-yellow-500" :
                isPast ? "border-[#292B30] text-gray-400" :
                "border-transparent text-gray-600"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                    isActive ? "border-yellow-500 bg-yellow-500/20" :
                    isPast ? "border-gray-500 bg-gray-500/20" :
                    "border-gray-700"
                  }`}>
                    {isPast ? <Check className="w-3 h-3" /> : s.id}
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">{s.label}</span>
                </div>
                {idx < 3 && <ChevronRight className={`ml-auto w-4 h-4 ${isPast ? "text-gray-500" : "text-transparent"}`} />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0D0D0F]">
          
          {step === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-yellow-500" />
                Employee Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Full Name *</label>
                  <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Designation *</label>
                  <input type="text" required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Department</label>
                  <select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none">
                    <option value="">Select Department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Reporting Manager</label>
                  <select value={formData.reportingManagerId} onChange={e => setFormData({...formData, reportingManagerId: e.target.value})} className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none">
                    <option value="">Select Manager...</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Joining Date</label>
                  <input type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none [color-scheme:dark]" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-500" />
                Login & Role Assignment
              </h3>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mb-6">
                <p className="text-sm text-yellow-200">
                  You are generating an active login account. The temporary password will be securely hashed via bcrypt.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Login Email *</label>
                  <input type="email" required value={formData.loginEmail} onChange={e => setFormData({...formData, loginEmail: e.target.value})} className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none" placeholder="name@minion.com" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Temporary Password *</label>
                    <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Confirm Password *</label>
                    <input type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full bg-[#151619] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none" />
                  </div>
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-400 text-xs">Passwords do not match.</p>
                )}

                <div className="pt-4 border-t border-[#292B30]">
                  <label className="block text-sm font-medium text-gray-300 mb-4">Application Role *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {roles.map(r => (
                      <div 
                        key={r.id} 
                        onClick={() => setFormData({...formData, roleId: r.id})}
                        className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${
                          formData.roleId === r.id 
                            ? "bg-[#1a1b1e] border-yellow-500" 
                            : "bg-[#151619] border-[#292B30] hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-bold ${formData.roleId === r.id ? "text-yellow-400" : "text-white"}`}>{r.name}</span>
                          {formData.roleId === r.id && <Check className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{r.description || "No description"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-500" />
                  Access Customization
                </h3>
                <div className="text-sm text-gray-400">
                  Base Role: <strong className="text-yellow-400">{selectedRole?.name}</strong>
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-4 h-4 rounded border border-gray-600 bg-[#292B30] flex items-center justify-center text-[10px] text-gray-400">✓</div>
                  <span>Inherited from Role</span>
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

              <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-x-auto">
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
                          <td className="px-4 py-3 font-semibold text-white sticky left-0 bg-[#151619] z-10 w-48 border-r border-[#292B30]">
                            {mod.toUpperCase()}
                          </td>
                          
                          {commonActions.map(action => {
                            const perm = modulePerms.find(p => p.action === action);
                            
                            if (!perm) {
                              return <td key={action} className="px-2 py-3 text-center bg-[#111113]/30 border-l border-[#292B30]/30"></td>;
                            }

                            const roleP = selectedRole?.permissions.find((rp: any) => rp.permissionId === perm.id);
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
                                  onClick={() => toggleOverride(perm.id)}
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
          )}

          {step === 4 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-500" />
                Review & Confirm
              </h3>

              <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-[#1a1b1e] border-b border-[#292B30] flex justify-between items-center">
                  <span className="font-bold text-white uppercase tracking-wider text-sm">EMPLOYEE</span>
                  <button onClick={() => setStep(1)} className="text-xs text-yellow-500 hover:underline">Edit</button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Full Name</div>
                    <div className="text-white font-medium">{formData.fullName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Designation</div>
                    <div className="text-white font-medium">{formData.designation}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Department</div>
                    <div className="text-white font-medium">
                      {departments.find(d => d.id === formData.departmentId)?.name || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Joining Date</div>
                    <div className="text-white font-medium">{formData.joiningDate}</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-[#1a1b1e] border-b border-[#292B30] flex justify-between items-center">
                  <span className="font-bold text-white uppercase tracking-wider text-sm">LOGIN & ACCESS</span>
                  <button onClick={() => setStep(2)} className="text-xs text-yellow-500 hover:underline">Edit</button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Login Email</div>
                    <div className="text-white font-medium">{formData.loginEmail}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Application Role</div>
                    <div className="text-yellow-400 font-bold">{selectedRole?.name}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-500 text-xs mb-1">Custom Overrides</div>
                    <div className="text-white font-medium">
                      {Object.keys(overrides).length > 0 
                        ? <span className="text-purple-400">{Object.keys(overrides).length} explicit overrides set</span>
                        : <span className="text-gray-400">Strictly inheriting role defaults</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#292B30] flex justify-between shrink-0 bg-[#111113]">
          <button 
            onClick={step === 1 ? onClose : handlePrev}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:text-white hover:bg-[#1a1b1e] transition-colors"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          
          {step < 4 ? (
            <button 
              onClick={handleNext}
              disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
              className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Create Employee Account"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
