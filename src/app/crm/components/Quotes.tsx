'use client';

import { useState, useTransition } from 'react';
import { FileText, Send, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { updateQuoteStatus, createQuote } from '@/app/actions/crm';

interface QuotesProps {
  quotes: any[];
  leads: any[];
  employees: any[];
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  'Draft': 'bg-gray-400/10 text-gray-400',
  'Sent': 'bg-yellow-400/10 text-yellow-400',
  'Accepted': 'bg-green-400/10 text-green-400',
  'Rejected': 'bg-red-400/10 text-red-400',
  'Expired': 'bg-orange-400/10 text-orange-400',
  'Cancelled': 'bg-gray-400/10 text-gray-500',
};

function QuoteCard({ quote, onRefresh }: { quote: any; onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition();
  const customerName = quote.customer?.name || quote.lead?.customer?.name || 'Unknown';
  const initials = customerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const createdByName = quote.createdBy?.user?.name || 'System';
  const dateStr = new Date(quote.date || quote.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalAmount = Number(quote.amount || 0);

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      try {
        await updateQuoteStatus(quote.id, newStatus);
        onRefresh();
      } catch {}
    });
  };

  return (
    <div className="bg-[#0D0D0F] rounded-xl border border-[#292B30] overflow-hidden hover:border-yellow-400/20 transition-all">
      <div className="p-4 border-b border-[#1e2025]">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
              <span className="text-yellow-400 text-[11px] font-bold">{initials}</span>
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">{customerName}</div>
              <div className="text-[11px] font-mono text-gray-600">{quote.quoteNumber || quote.id.slice(0, 8)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-600 bg-[#151619] px-2 py-0.5 rounded">{quote.type}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[quote.status] || statusColors['Draft']}`}>
              {quote.status}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-gray-500">
          {dateStr} · By: {createdByName}
          {quote.lead && <span> · Lead: {quote.lead.leadNumber}</span>}
        </div>
      </div>

      {/* Line items */}
      <div className="px-4 py-3 space-y-2">
        {quote.lineItems?.length > 0 ? (
          <>
            {quote.lineItems.slice(0, 4).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-[12px]">
                <span className="text-gray-400">{item.category}</span>
                <span className="text-gray-300 font-semibold">₹{Number(item.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
            {quote.lineItems.length > 4 && (
              <div className="text-[11px] text-gray-600">+{quote.lineItems.length - 4} more items...</div>
            )}
          </>
        ) : (
          <div className="text-[12px] text-gray-600">No line items</div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-[#1e2025]">
          <span className="text-[13px] font-bold text-yellow-400">Total</span>
          <span className="text-[15px] font-bold text-white">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        {quote.status === 'Draft' && (
          <button
            onClick={() => handleStatusChange('Sent')}
            disabled={isPending}
            className="flex items-center gap-1.5 flex-1 justify-center bg-yellow-400/10 border border-yellow-400/20 hover:bg-yellow-400/20 text-yellow-400 text-[11px] font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Send
          </button>
        )}
        {quote.status === 'Sent' && (
          <>
            <button
              onClick={() => handleStatusChange('Accepted')}
              disabled={isPending}
              className="flex items-center gap-1.5 flex-1 justify-center bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 text-[11px] font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => handleStatusChange('Rejected')}
              disabled={isPending}
              className="flex items-center gap-1.5 flex-1 justify-center bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        <button className="flex items-center gap-1.5 justify-center bg-[#151619] border border-[#292B30] hover:border-yellow-400/30 text-gray-300 hover:text-white text-[11px] font-semibold py-2 px-3 rounded-lg transition-all">
          <FileText className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function Quotes({ quotes, leads, employees, onRefresh }: QuotesProps) {
  const [statusFilter, setStatusFilter] = useState('All');
  const statuses = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected'];

  const filtered = statusFilter === 'All' ? quotes : quotes.filter(q => q.status === statusFilter);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              statusFilter === s
                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
                : 'bg-[#0D0D0F] border-[#292B30] text-gray-500 hover:border-gray-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <div className="text-3xl mb-2">📄</div>
          <div className="text-[13px] font-semibold">No quotes found</div>
          <div className="text-[11px] mt-1">Create a quote from a lead or deal</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(q => <QuoteCard key={q.id} quote={q} onRefresh={onRefresh} />)}
        </div>
      )}
    </div>
  );
}
