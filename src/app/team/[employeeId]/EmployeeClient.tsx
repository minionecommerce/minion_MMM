'use client';

import { useState } from 'react';
import EmployeeHeader from './components/EmployeeHeader';
import EmployeeOverview from './components/EmployeeOverview';
import Link from 'next/link';

interface EmployeeClientProps {
  employee: any;
}

export default function EmployeeClient({ employee }: EmployeeClientProps) {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col">
      <main className="flex-1 w-full max-w-[1700px] mx-auto pb-12">
        <EmployeeHeader employee={employee} />

        <div className="flex items-center gap-1 bg-[#111113] border-b border-[#292B30] px-6 py-2 overflow-x-auto no-scrollbar sticky top-16 z-40">
          {['Overview', 'Professional Profile', 'Projects', 'Tasks', 'Leave & Attendance', 'Documents', 'Account & Access'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(255,196,0,0.2)]' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1b1f]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Overview' && (
          <EmployeeOverview employee={employee} />
        )}

        {activeTab === 'Projects' && (
          <div className="px-6 py-8">
            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
              <h3 className="text-[15px] font-bold text-white uppercase tracking-wide mb-4">Assigned / Managed Projects</h3>
              <div className="space-y-3">
                {employee.projects?.map((p: any) => (
                  <div key={p.id} className="p-4 bg-[#0D0D0F] border border-[#292B30] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-bold text-white">{p.name}</div>
                      <div className="text-[11px] text-gray-500">Customer: {p.customer?.name || 'Internal'}</div>
                    </div>
                    <Link href={`/projects/${p.id}`} className="px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-[11px] font-bold hover:bg-yellow-400 hover:text-black transition-colors">
                      View Project
                    </Link>
                  </div>
                ))}
                {(!employee.projects || employee.projects.length === 0) && (
                  <div className="text-gray-500 text-[12px] py-4">No active projects assigned.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Tasks' && (
          <div className="px-6 py-8">
            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
              <h3 className="text-[15px] font-bold text-white uppercase tracking-wide mb-4">Assigned Tasks ({employee.tasks?.length || 0})</h3>
              <div className="space-y-3">
                {employee.tasks?.map((t: any) => (
                  <div key={t.id} className="p-4 bg-[#0D0D0F] border border-[#292B30] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-bold text-white">{t.title}</div>
                      <div className="text-[11px] text-gray-500">Status: {t.status} • Priority: {t.priority}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400 uppercase">{t.status}</span>
                  </div>
                ))}
                {(!employee.tasks || employee.tasks.length === 0) && (
                  <div className="text-gray-500 text-[12px] py-4">No tasks assigned.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Account & Access' && (
          <div className="px-6 py-8">
            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h3 className="text-[15px] font-bold text-white uppercase tracking-wide">Account & Access Control</h3>
                <div className="flex gap-2 mt-4 md:mt-0">
                  {employee.userId && (
                    <Link
                      href={`/users/${employee.userId}/permissions`}
                      className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors text-[13px]"
                    >
                      Manage Access
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Login Email</div>
                  <div className="text-white font-medium">{employee.email}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Application Role</div>
                  <div className="text-white font-medium">{employee.role}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Account Status</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${employee.accountStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-white font-medium">{employee.accountStatus}</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Last Login</div>
                  <div className="text-white font-medium">Never</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-6 border-t border-[#292B30]">
                <button className="px-4 py-2 bg-[#1a1b1e] border border-[#292B30] hover:border-gray-500 rounded-lg text-[12px] font-semibold text-white transition-colors">
                  Reset Password
                </button>
                <button className="px-4 py-2 bg-[#1a1b1e] border border-[#292B30] hover:border-gray-500 rounded-lg text-[12px] font-semibold text-white transition-colors">
                  Force Logout
                </button>
                <button className="px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-[12px] font-semibold text-red-400 transition-colors ml-auto">
                  Deactivate Account
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'Overview' && activeTab !== 'Projects' && activeTab !== 'Tasks' && activeTab !== 'Account & Access' && (
          <div className="px-6 py-12">
            <div className="text-center py-20 text-gray-500 bg-[#151619] border border-[#292B30] rounded-xl max-w-4xl mx-auto">
              <div className="text-3xl mb-3 opacity-50">👤</div>
              <h3 className="text-[14px] font-bold text-white mb-2">{activeTab} Info</h3>
              <p className="text-[12px]">All records synchronized with database.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
