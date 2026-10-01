'use client';

import { TeamMember } from '../../data/mock';
import { Users, Plus, Shield, CheckSquare, Mail, Phone } from 'lucide-react';

interface ProjectTeamProps {
  team: TeamMember[];
}

export default function ProjectTeam({ team }: ProjectTeamProps) {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-white">PROJECT TEAM</h2>
            <div className="text-[12px] font-semibold text-gray-400 mt-1">{team.length} members assigned</div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Assign Member
        </button>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {team.map(member => {
          const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          const isManager = member.role.includes('Manager');

          return (
            <div key={member.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-yellow-400/30 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
                  <span className="text-yellow-400 text-[14px] font-bold">{initials}</span>
                </div>
                {isManager && (
                  <div className="bg-yellow-400/10 p-1.5 rounded-lg text-yellow-400">
                    <Shield className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-white leading-tight">{member.name}</h3>
                <div className="text-[12px] font-semibold text-yellow-400 mt-0.5">{member.role}</div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Responsibility</div>
                  <div className="text-[12px] font-semibold text-gray-300">{member.responsibility}</div>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Assigned Tasks
                  </span>
                  <span className="font-bold text-white bg-[#0D0D0F] border border-[#292B30] px-2 py-0.5 rounded-full">{member.taskCount}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#1e2025] flex items-center gap-2">
                <button className="flex-1 py-2 bg-[#0D0D0F] border border-[#292B30] text-[11px] font-semibold text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
                <button className="flex-1 py-2 bg-[#0D0D0F] border border-[#292B30] text-[11px] font-semibold text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Call
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
