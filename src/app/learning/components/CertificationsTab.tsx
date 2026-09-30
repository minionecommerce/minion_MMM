'use client';

import { Award, Shield, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const mockCertifications = [
  {
    id: 'cert-1',
    name: 'Advanced Smart Home Architect',
    provider: 'Minion Internal',
    level: 'Expert',
    status: 'Earned',
    dateEarned: '2026-08-15',
    icon: 'Shield',
    skills: ['Home Automation', 'Network Architecture', 'IoT Integration']
  },
  {
    id: 'cert-2',
    name: 'Control4 Certified Technician',
    provider: 'Control4',
    level: 'Intermediate',
    status: 'In Progress',
    progress: 75,
    icon: 'Award',
    skills: ['Control4 OS', 'Audio Distribution']
  },
  {
    id: 'cert-3',
    name: 'CEDIA Cabling Specialist',
    provider: 'CEDIA',
    level: 'Beginner',
    status: 'Available',
    icon: 'Award',
    skills: ['Low Voltage Wiring', 'Structured Cabling']
  }
];

export default function CertificationsTab() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#151619] to-[#0D0D0F] border border-[#292B30] rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-[20px] font-black text-white uppercase tracking-wide flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Certifications & Badges
          </h2>
          <p className="text-[12px] text-gray-400 mt-2 max-w-lg leading-relaxed">
            Validate your expertise and showcase your achievements. Earn industry-recognized certifications and internal Minion badges to level up your career.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockCertifications.map((cert, idx) => (
          <div 
            key={cert.id} 
            className="group relative bg-[#151619] border border-[#292B30] rounded-2xl overflow-hidden hover:border-yellow-400/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,196,0,0.1)] hover:-translate-y-1 p-6"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              {cert.status === 'Earned' && (
                <div className="bg-green-400/10 border border-green-400/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 uppercase">
                  <CheckCircle2 className="w-3 h-3" /> Earned
                </div>
              )}
              {cert.status === 'In Progress' && (
                <div className="bg-blue-400/10 border border-blue-400/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase">
                  In Progress
                </div>
              )}
            </div>

            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl mb-5 flex items-center justify-center border ${
              cert.status === 'Earned' ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' : 'bg-[#0D0D0F] border-[#292B30] text-gray-400 group-hover:text-yellow-400'
            } transition-colors`}>
              {cert.icon === 'Shield' ? <Shield className="w-7 h-7" /> : <Award className="w-7 h-7" />}
            </div>

            <h3 className="text-[16px] font-bold text-white mb-1 leading-tight group-hover:text-yellow-400 transition-colors">
              {cert.name}
            </h3>
            <div className="text-[11px] font-semibold text-gray-500 mb-4">
              Issued by <span className="text-gray-300">{cert.provider}</span> • {cert.level}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {cert.skills.map(skill => (
                <span key={skill} className="bg-[#0D0D0F] border border-[#292B30] text-gray-400 text-[10px] font-medium px-2 py-1 rounded">
                  {skill}
                </span>
              ))}
            </div>

            {cert.status === 'Earned' && (
              <div className="text-[11px] text-gray-400 font-semibold mb-2">
                Earned on {new Date(cert.dateEarned!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            )}

            {cert.status === 'In Progress' && cert.progress !== undefined && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Progress</span>
                  <span className="text-[11px] font-bold text-white">{cert.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30]">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${cert.progress}%` }} />
                </div>
              </div>
            )}

            <button className="w-full mt-auto py-2.5 flex items-center justify-center gap-2 bg-[#0D0D0F] border border-[#292B30] group-hover:border-yellow-400/50 rounded-lg text-[12px] font-bold text-gray-300 group-hover:text-yellow-400 transition-all">
              {cert.status === 'Earned' ? 'View Certificate' : cert.status === 'In Progress' ? 'Continue Path' : 'Start Path'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
