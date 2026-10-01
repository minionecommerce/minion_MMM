'use client';

import { Employee } from '../../data/mock';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, Edit2, MoreVertical, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface EmployeeHeaderProps {
  employee: Employee;
}

const statusColors: Record<string, string> = {
  'Active': 'bg-green-400/10 text-green-400 border-green-400/20',
  'On Leave': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  'Remote': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  'Probation': 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  'Intern': 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  'Notice Period': 'bg-orange-400/10 text-orange-400 border-orange-400/20',
};

export default function EmployeeHeader({ employee }: EmployeeHeaderProps) {
  return (
    <div className="bg-[#111113] border-b border-[#292B30]">
      {/* Top Nav */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#292B30] bg-[#0D0D0F]">
        <Link href="/team" className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-yellow-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
        </Link>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg text-[11px] font-bold transition-colors">
            Assign
          </button>
          <div className="w-px h-4 bg-[#292B30] mx-1" />
          <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1b1f] transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1b1f] transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          
          {/* Avatar */}
          <div className="w-32 h-32 rounded-3xl bg-[#151619] border border-[#292B30] flex items-center justify-center text-[40px] font-black text-yellow-400 shadow-xl shrink-0">
            {employee.fullName.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title & Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-[32px] font-black text-white tracking-tight leading-tight mb-1">{employee.fullName.toUpperCase()}</h1>
                <div className="flex items-center gap-3 text-[14px]">
                  <span className="font-bold text-yellow-400">{employee.designation}</span>
                  <span className="text-gray-600">•</span>
                  <span className="font-medium text-gray-400">{employee.department}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider border ${statusColors[employee.status] || 'bg-gray-400/10 text-gray-400 border-gray-400/20'}`}>
                  {employee.status}
                </span>
                <span className="text-[12px] font-mono text-gray-500 font-semibold">{employee.employeeCode}</span>
              </div>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-[#151619] border border-[#292B30] rounded-xl p-5 mt-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email</span>
                <span className="text-[12px] font-semibold text-white">{employee.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone</span>
                <span className="text-[12px] font-semibold text-white">{employee.phone}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Location</span>
                <span className="text-[12px] font-semibold text-white">{employee.workLocation}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Joined</span>
                <span className="text-[12px] font-semibold text-white">
                  {new Date(employee.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#151619] border border-[#292B30] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-400/10 border border-blue-400/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Reporting Manager</div>
                  <div className="text-[13px] font-bold text-white">{employee.reportingManagerName || 'Board of Directors'}</div>
                </div>
              </div>
              <div className="bg-[#151619] border border-[#292B30] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-400/10 border border-purple-400/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Employment Type</div>
                  <div className="text-[13px] font-bold text-white">{employee.employmentType}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
