'use client';

import { IrrigationSystem } from '../../data/mock';
import { Droplets, Settings, Power, Calendar, AlertTriangle, CheckCircle2, Play } from 'lucide-react';

interface IrrigationManagementProps {
  irrigation: IrrigationSystem[];
}

export default function IrrigationManagement({ irrigation }: IrrigationManagementProps) {
  if (irrigation.length === 0) {
    return (
      <div className="text-center py-16 bg-[#151619] rounded-xl border border-[#292B30]">
        <Droplets className="w-8 h-8 text-cyan-400/50 mx-auto mb-3" />
        <div className="text-[14px] font-semibold text-gray-400">No irrigation systems configured</div>
      </div>
    );
  }

  const system = irrigation[0]; // For simplicity, showing the first system

  return (
    <div className="space-y-6">
      
      {/* Top Level: System Info & Water Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Info */}
        <div className="lg:col-span-2 bg-[#151619] border border-[#292B30] rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-[18px] font-black text-white">{system.type}</h2>
                <div className="text-[12px] font-mono text-yellow-400 mt-1">{system.id}</div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              system.status === 'ACTIVE' ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'
            }`}>
              {system.status}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Controller</div>
              <div className="text-[12px] font-semibold text-white truncate">{system.controller}</div>
            </div>
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Source</div>
              <div className="text-[12px] font-semibold text-white truncate">{system.waterSource}</div>
            </div>
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Last Insp.</div>
              <div className="text-[12px] font-semibold text-white">{new Date(system.lastInspection).toLocaleDateString('en-GB')}</div>
            </div>
            <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Next Insp.</div>
              <div className="text-[12px] font-semibold text-amber-400">{new Date(system.nextInspection).toLocaleDateString('en-GB')}</div>
            </div>
          </div>
        </div>

        {/* Water Management */}
        <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
            Water Management
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400">Today</span>
              <span className="text-[14px] font-bold text-white">1,240 L</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400">This Week</span>
              <span className="text-[14px] font-bold text-white">8,640 L</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#292B30] pb-4">
              <span className="text-[11px] font-semibold text-gray-400">This Month</span>
              <span className="text-[14px] font-bold text-white">31,500 L</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[12px] font-bold text-cyan-400 uppercase tracking-wider">Water Saved</span>
              <span className="text-[18px] font-black text-cyan-400">18%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Irrigation Zones */}
      <div>
        <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-4">Smart Irrigation Zones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {system.zones.map(zone => (
            <div key={zone.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-cyan-400/30 transition-colors">
              <div className="flex items-center justify-between mb-4 border-b border-[#292B30] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black px-2 py-0.5 bg-cyan-400/10 text-cyan-400 rounded">
                    {zone.id}
                  </span>
                  <span className="text-[14px] font-bold text-white">{zone.name}</span>
                </div>
                {zone.status === 'ACTIVE' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500">Duration</span>
                  <span className="text-[12px] font-bold text-white">{zone.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500">Schedule</span>
                  <span className="text-[12px] font-bold text-white flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" /> {zone.schedule}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500">Frequency</span>
                  <span className="text-[12px] font-bold text-white">{zone.frequency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500">Soil Moisture</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-cyan-400">{zone.soilMoisture}%</span>
                    <div className="w-12 h-1 bg-[#0D0D0F] rounded-full overflow-hidden border border-[#292B30]">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${zone.soilMoisture}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-[11px] font-bold transition-colors">
                  <Play className="w-3.5 h-3.5" /> Run Now
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0D0D0F] border border-[#292B30] hover:border-gray-500 text-[11px] font-bold text-gray-300 hover:text-white transition-colors">
                  <Settings className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            </div>
          ))}

          {/* Add Zone Card */}
          <button className="bg-[#151619] border border-[#292B30] border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-gray-500 hover:text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all min-h-[260px]">
            <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center mb-2">
              <span className="text-xl leading-none font-bold">+</span>
            </div>
            <span className="text-[12px] font-bold tracking-wider">ADD ZONE</span>
          </button>
        </div>
      </div>

    </div>
  );
}
