'use client';

import { CategoryData } from '../data/mock';
import { Target, FolderKanban, Star, BookOpen, Heart, Users, ChevronRight } from 'lucide-react';

interface RewardCategoriesProps {
  categories: CategoryData[];
}

const iconMap: Record<string, any> = {
  Target,
  FolderKanban,
  Star,
  BookOpen,
  Heart,
  Users
};

export default function RewardCategories({ categories }: RewardCategoriesProps) {
  return (
    <div>
      <h2 className="text-[14px] font-bold text-white uppercase tracking-wide mb-4">Achievement Categories</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const Icon = iconMap[cat.iconType] || Star;
          return (
            <div key={cat.id} className="bg-[#151619] border border-[#292B30] rounded-xl p-5 hover:border-gray-500 transition-colors flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#111113] border border-[#292B30] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-[14px] font-bold text-white">{cat.name}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Achievements</span>
                  <span className="text-[18px] font-black text-white leading-none">{String(cat.achievementCount).padStart(2, '0')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Points</span>
                  <span className="text-[18px] font-black text-yellow-400 leading-none">{cat.pointsEarned}</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-[#292B30]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Latest Achievement</span>
                <span className="text-[12px] font-bold text-gray-300 truncate block">{cat.latestAchievement}</span>
              </div>

              <button className="absolute right-5 bottom-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
