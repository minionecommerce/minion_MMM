'use client';

import { Users, Building2, MapPin, TrendingUp, ChevronRight } from 'lucide-react';

interface CustomersProps {
  leads: any[];
}

export default function Customers({ leads }: CustomersProps) {
  // Group by customerId
  const customerMap = new Map<string, {
    name: string;
    customerType: string;
    phone: string;
    email: string;
    customerId: string;
    leads: any[];
    totalValue: number;
  }>();

  for (const lead of leads) {
    const existing = customerMap.get(lead.customerId);
    if (existing) {
      existing.leads.push(lead);
      existing.totalValue += lead.expectedValue || 0;
    } else {
      customerMap.set(lead.customerId, {
        name: lead.customerName,
        customerType: lead.customerType,
        phone: lead.phone,
        email: lead.email,
        customerId: lead.customerId,
        leads: [lead],
        totalValue: lead.expectedValue || 0,
      });
    }
  }

  const customers = Array.from(customerMap.values());

  if (customers.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <Users className="w-10 h-10 mx-auto mb-3 text-gray-700" />
        <div className="text-[13px] font-semibold">No customers yet</div>
        <div className="text-[11px] mt-1">Create a lead to add a customer</div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {customers.map(c => {
          const initials = c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
          const wonLeads = c.leads.filter((l: any) => l.stage === 'Won').length;
          const activeLeads = c.leads.filter((l: any) => !['Won', 'Lost'].includes(l.stage)).length;

          return (
            <div key={c.customerId} className="bg-[#0D0D0F] rounded-xl border border-[#292B30] p-4 hover:border-yellow-400/20 transition-all cursor-pointer">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
                  <span className="text-yellow-400 text-[12px] font-bold">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-white truncate">{c.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {c.customerType === 'Company' ? <Building2 className="w-3 h-3 text-gray-600" /> : <Users className="w-3 h-3 text-gray-600" />}
                    <span className="text-[11px] text-gray-500">{c.customerType}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 mb-3 text-[11px]">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-600">📞</span> {c.phone}
                </div>
                {c.email && c.email !== 'N/A' && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-gray-600">✉</span> {c.email}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1e2025]">
                <div className="text-center">
                  <div className="text-[14px] font-bold text-white">{c.leads.length}</div>
                  <div className="text-[10px] text-gray-600">Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-bold text-blue-400">{activeLeads}</div>
                  <div className="text-[10px] text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-bold text-green-400">{wonLeads}</div>
                  <div className="text-[10px] text-gray-600">Won</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
