'use client';

import { Star, Plus, User, Calendar, MessageSquare } from 'lucide-react';

interface RecognitionTabProps {
  ledgers: any[];
  employees: any[];
  onOpenGive: () => void;
}

export default function RecognitionTab({ ledgers, employees, onOpenGive }: RecognitionTabProps) {
  const recognitions = ledgers.filter((l: any) => l.category === 'Recognition' || l.source === 'Peer Recognition');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151619] border border-[#292B30] rounded-xl p-5">
        <div>
          <h2 className="text-[16px] font-bold text-white uppercase tracking-wide">Peer Recognitions & Kudos</h2>
          <p className="text-[12px] text-gray-400">Celebrate team members for exceptional support, innovation, and leadership</p>
        </div>
        <button
          onClick={onOpenGive}
          className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-300 text-black text-[12px] font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(96,165,250,0.15)] self-start sm:self-auto"
        >
          <Star className="w-4 h-4 fill-black" />
          Give Recognition
        </button>
      </div>

      {recognitions.length === 0 ? (
        <div className="text-center py-16 bg-[#151619] border border-[#292B30] rounded-xl">
          <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-white font-bold text-[14px]">No recognitions sent yet</h3>
          <p className="text-gray-500 text-[12px] mt-1 mb-4">Be the first to appreciate a colleague!</p>
          <button
            onClick={onOpenGive}
            className="px-4 py-2 bg-blue-400 text-black font-bold text-[12px] rounded-lg"
          >
            Give Recognition
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recognitions.map((rec: any) => {
            const empName = rec.employee?.user?.name || rec.employee?.designation || 'Colleague';
            return (
              <div key={rec.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-400/10 border border-blue-400/20 flex items-center justify-center font-bold text-blue-400">
                      {empName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-white uppercase">{empName}</h4>
                      <span className="text-[10px] font-semibold text-gray-400">{rec.employee?.designation || 'Team Member'}</span>
                    </div>
                  </div>
                  <span className="text-[12px] font-black text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-0.5 rounded">
                    +{rec.points} PTS
                  </span>
                </div>

                <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3 text-[13px] text-gray-200 italic flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p>"{rec.description}"</p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase pt-2">
                  <span>Source: {rec.source || 'Peer Recognition'}</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(rec.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
