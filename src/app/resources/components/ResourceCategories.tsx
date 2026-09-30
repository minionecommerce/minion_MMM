'use client';

import { ResourceCategory } from '../data/mock';
import { 
  Building, FileText, Shield, Users, CreditCard, Target, 
  FolderKanban, Box, LayoutTemplate, Megaphone
} from 'lucide-react';

interface ResourceCategoriesProps {
  categories: ResourceCategory[];
}

const iconMap: Record<string, any> = {
  Building, FileText, Shield, Users, CreditCard, Target, 
  FolderKanban, Box, LayoutTemplate, Megaphone
};

export default function ResourceCategories({ categories }: ResourceCategoriesProps) {
  return (
    <div>
      <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-4">Categories</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map(cat => {
          const Icon = iconMap[cat.iconType] || FileText;
          return (
            <div 
              key={cat.id} 
              className="bg-[#151619] border border-[#292B30] rounded-xl p-4 hover:border-yellow-400/50 hover:bg-[#1a1b1f] transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                <span className="text-[13px] font-bold text-white group-hover:text-yellow-400 transition-colors">{cat.name}</span>
              </div>
              <span className="text-[10px] font-bold text-gray-500 bg-[#0D0D0F] px-1.5 py-0.5 rounded group-hover:text-yellow-400/70 transition-colors">
                {cat.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
