'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  X, Phone, MessageCircle, Mail, CheckCircle2, Calendar,
  MapPin, User, FileText, Clock, ChevronRight, Edit2, Send, StickyNote, Plus, Loader2, ChevronDown
} from 'lucide-react';
import { updateLeadStage, createFollowUp, getLeadAuditLog } from '@/app/actions/crm';
import WorkflowStepper from './WorkflowStepper';

const stageColors: Record<string, string> = {
  'New': 'bg-blue-400/10 text-blue-400',
  'Contacted': 'bg-cyan-400/10 text-cyan-400',
  'Requirements Collected': 'bg-indigo-400/10 text-indigo-400',
  'Preliminary Quote Sent': 'bg-yellow-400/10 text-yellow-400',
  'Follow-up': 'bg-orange-400/10 text-orange-400',
  'Site Visit Scheduled': 'bg-purple-400/10 text-purple-400',
  'Site Visit Completed': 'bg-purple-400/10 text-purple-400',
  'Final Quote Sent': 'bg-amber-400/10 text-amber-400',
  'Negotiation': 'bg-pink-400/10 text-pink-400',
  'Won': 'bg-green-400/10 text-green-400',
  'Lost': 'bg-red-400/10 text-red-400',
  'On Hold': 'bg-gray-400/10 text-gray-400',
};

const LEAD_STAGES = [
  'New', 'Contacted', 'Requirements Collected', 'Preliminary Quote Sent',
  'Follow-up', 'Site Visit Scheduled', 'Site Visit Completed',
  'Final Quote Sent', 'Negotiation', 'Won', 'Lost', 'On Hold',
];

type DrawerTab = 'overview' | 'timeline' | 'quote';

interface LeadDetailsDrawerProps {
  lead: any | null;
  employees: any[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function LeadDetailsDrawer({ lead, employees, onClose, onRefresh }: LeadDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');
  const [note, setNote] = useState('');
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  if (!lead) return null;

  const initials = lead.customerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const latestQuote = lead.quotes?.find((q: any) => q.type === 'Final') || lead.quotes?.[0];

  // Load audit log when timeline tab is opened
  const handleTimelineTab = async () => {
    setActiveTab('timeline');
    if (auditLog.length === 0 && !logLoading) {
      setLogLoading(true);
      try {
        const logs = await getLeadAuditLog(lead.id);
        setAuditLog(logs as any[]);
      } catch {}
      setLogLoading(false);
    }
  };

  const handleStageChange = (stage: string) => {
    setStageDropdownOpen(false);
    startTransition(async () => {
      try {
        await updateLeadStage(lead.id, stage);
        onRefresh();
      } catch {}
    });
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    startTransition(async () => {
      try {
        // Create a follow-up as a note log
        await createFollowUp({
          customerId: lead.customerId,
          leadId: lead.id,
          assignedToId: employees[0]?.id || '',
          scheduledDate: new Date().toISOString(),
          type: 'Call',
          purpose: note.trim(),
          notes: note.trim(),
        });
        setNote('');
        onRefresh();
      } catch {}
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[560px] bg-[#151619] border-l border-[#292B30] z-50 flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#292B30] bg-[#111113]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Lead Details</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Customer info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 flex items-center justify-center shrink-0">
              <span className="text-yellow-400 text-[14px] font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-bold text-white truncate">{lead.customerName}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-[11px] text-gray-500 font-mono">{lead.leadNumber || lead.id.slice(0, 8)}</span>
                <span className="text-[11px] text-gray-600">•</span>
                <span className="text-[11px] text-gray-500">{lead.customerType}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${stageColors[lead.stage] ?? 'bg-gray-400/10 text-gray-400'}`}>
                  {lead.stage}
                </span>
              </div>
            </div>
          </div>

          {/* Quick contact */}
          <div className="flex items-center gap-2 mt-3">
            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 flex-1 justify-center bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 text-[11px] font-semibold py-1.5 rounded-lg transition-all">
              <Phone className="w-3 h-3" /> Call
            </a>
            <a href={`https://wa.me/${(lead.whatsapp || lead.phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 flex-1 justify-center bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 text-[#25D366] text-[11px] font-semibold py-1.5 rounded-lg transition-all">
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>
            <a href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 flex-1 justify-center bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 text-[11px] font-semibold py-1.5 rounded-lg transition-all">
              <Mail className="w-3 h-3" /> Email
            </a>
            <button className="w-8 h-8 bg-[#0D0D0F] border border-[#292B30] rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Workflow Stepper */}
        <div className="px-5 py-3 border-b border-[#292B30] bg-[#0D0D0F]">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">CUSTOMER JOURNEY</div>
          <WorkflowStepper currentStage={lead.stage} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#292B30] bg-[#111113]">
          {(['overview', 'timeline', 'quote'] as DrawerTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => tab === 'timeline' ? handleTimelineTab() : setActiveTab(tab)}
              className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px ${
                activeTab === tab ? 'text-yellow-400 border-yellow-400' : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'timeline' ? 'Timeline' : 'Quote'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ---- OVERVIEW TAB ---- */}
          {activeTab === 'overview' && (
            <div className="p-5 space-y-4">

              {/* Next Action */}
              <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider">Next Action</span>
                </div>
                <p className="text-[14px] font-bold text-white mb-1">{lead.nextAction || 'No action scheduled'}</p>
                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lead.nextActionDate || 'No date set'}</span>
                  <span className="text-gray-600">•</span>
                  <User className="w-3.5 h-3.5" />
                  <span>{lead.salesExecutive || 'Unassigned'}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Contact Information</div>
                <div className="grid grid-cols-2 gap-2">
                  <InfoBox icon={Phone} label="Phone" value={lead.phone} />
                  <InfoBox icon={Mail} label="Email" value={lead.email} />
                  <InfoBox icon={MessageCircle} label="WhatsApp" value={lead.whatsapp || lead.phone} />
                  <InfoBox icon={User} label="Customer Type" value={lead.customerType} />
                </div>
              </div>

              {/* Property Info */}
              <div>
                <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Property Information</div>
                <div className="grid grid-cols-2 gap-2">
                  <InfoBox icon={MapPin} label="Site Location" value={lead.siteLocation} />
                  <InfoBox icon={FileText} label="Property Type" value={lead.propertyType} />
                  <div className="col-span-2 bg-[#0D0D0F] rounded-lg border border-[#292B30] p-3">
                    <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Requirement</div>
                    <p className="text-[12px] text-gray-300 leading-relaxed">{lead.requirement}</p>
                  </div>
                </div>
              </div>

              {/* Services */}
              {lead.services?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Services Required</div>
                  <div className="flex flex-wrap gap-2">
                    {['Home Automation', 'Interior Design', 'Landscaping', 'Security', 'Garden Automation', 'False Ceiling'].map(svc => (
                      <div key={svc} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                        lead.services.includes(svc)
                          ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
                          : 'bg-[#0D0D0F] border-[#292B30] text-gray-600'
                      }`}>
                        {lead.services.includes(svc) ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <div className="w-3 h-3 rounded-sm border border-gray-700" />
                        )}
                        {svc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commercial Info */}
              <div>
                <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Commercial Information</div>
                <div className="grid grid-cols-2 gap-2">
                  <InfoBox icon={FileText} label="Budget Range" value={lead.budgetRange || 'TBD'} />
                  <InfoBox icon={Calendar} label="Lead Source" value={lead.source || 'Unknown'} />
                  {lead.prelimQuoteAmount && (
                    <div className="col-span-2 bg-[#0D0D0F] rounded-lg border border-[#292B30] p-3">
                      <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Preliminary Quote</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] font-bold text-white">₹{Number(lead.prelimQuoteAmount).toLocaleString('en-IN')}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          lead.prelimQuoteStatus === 'Accepted' ? 'bg-green-400/10 text-green-400' :
                          lead.prelimQuoteStatus === 'Sent' ? 'bg-yellow-400/10 text-yellow-400' :
                          lead.prelimQuoteStatus === 'Rejected' ? 'bg-red-400/10 text-red-400' :
                          'bg-gray-400/10 text-gray-400'
                        }`}>
                          {lead.prelimQuoteStatus}
                        </span>
                      </div>
                      {lead.prelimQuoteDate && <div className="text-[11px] text-gray-500 mt-1">Sent: {lead.prelimQuoteDate}</div>}
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment */}
              <div>
                <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Assignment</div>
                <div className="grid grid-cols-2 gap-2">
                  <InfoBox icon={User} label="Sales Executive" value={lead.salesExecutive || 'Unassigned'} />
                  <InfoBox icon={Calendar} label="Created" value={lead.createdDate} />
                </div>
              </div>

              {/* Notes */}
              {lead.notes && (
                <div>
                  <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Notes</div>
                  <div className="bg-[#0D0D0F] border border-[#292B30] rounded-lg p-3">
                    <p className="text-[12px] text-gray-300 leading-relaxed">{lead.notes}</p>
                  </div>
                </div>
              )}

              {/* Add note */}
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <StickyNote className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-600" />
                  <textarea
                    rows={2}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg pl-9 pr-3 py-2.5 text-[12px] text-white placeholder-gray-700 focus:outline-none focus:border-yellow-400/50 transition-colors resize-none"
                  />
                </div>
                <button
                  onClick={handleAddNote}
                  disabled={isPending || !note.trim()}
                  className="w-9 h-9 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* ---- TIMELINE TAB ---- */}
          {activeTab === 'timeline' && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[12px] font-bold text-white">Activity Timeline</div>
                <button className="flex items-center gap-1 text-[11px] text-yellow-400 hover:text-yellow-300 transition-colors font-semibold">
                  <Plus className="w-3 h-3" /> Log Activity
                </button>
              </div>
              {logLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading timeline...
                </div>
              ) : auditLog.length === 0 ? (
                <div className="text-center py-10 text-gray-600">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-[13px] font-semibold">No activity yet</div>
                </div>
              ) : (
                <div className="relative pl-4">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-[#292B30]" />
                  <div className="space-y-4">
                    {auditLog.map((log: any) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[17px] top-1 w-3 h-3 rounded-full bg-yellow-400 border-2 border-[#151619]" />
                        <div className="bg-[#0D0D0F] rounded-lg border border-[#292B30] p-3">
                          <div className="text-[12px] font-bold text-white mb-0.5">{log.action}</div>
                          {log.oldValue && log.newValue && (
                            <div className="text-[11px] text-gray-500 mb-1">
                              {(() => {
                                try {
                                  const old = JSON.parse(log.oldValue);
                                  const nw = JSON.parse(log.newValue);
                                  return `${old.status || JSON.stringify(old)} → ${nw.status || JSON.stringify(nw)}`;
                                } catch {
                                  return '';
                                }
                              })()}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-gray-600">
                            <span>{log.performedBy?.user?.name || 'System'}</span>
                            <span>·</span>
                            <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- QUOTE TAB ---- */}
          {activeTab === 'quote' && (
            <div className="p-5">
              {latestQuote ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[14px] font-bold text-white">{latestQuote.type} Quote</div>
                      <div className="text-[11px] font-mono text-gray-500 mt-0.5">{latestQuote.quoteNumber || latestQuote.id.slice(0, 8)}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      latestQuote.status === 'Accepted' ? 'bg-green-400/10 text-green-400' :
                      latestQuote.status === 'Sent' ? 'bg-yellow-400/10 text-yellow-400' :
                      latestQuote.status === 'Rejected' ? 'bg-red-400/10 text-red-400' :
                      'bg-gray-400/10 text-gray-400'
                    }`}>
                      {latestQuote.status}
                    </span>
                  </div>

                  {latestQuote.lineItems?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {latestQuote.lineItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#0D0D0F] rounded-lg border border-[#292B30]">
                          <div>
                            <div className="text-[12px] font-semibold text-white">{item.category}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">{item.description}</div>
                          </div>
                          <span className="text-[13px] font-bold text-white">₹{Number(item.amount).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 bg-yellow-400/5 rounded-lg border border-yellow-400/20">
                        <span className="text-[13px] font-bold text-yellow-400 uppercase tracking-wide">Total</span>
                        <span className="text-[16px] font-bold text-white">₹{Number(latestQuote.amount).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 bg-[#0D0D0F] border border-[#292B30] text-gray-300 hover:text-white text-[12px] font-semibold py-2.5 rounded-lg transition-all">
                      <FileText className="w-3.5 h-3.5" /> View Quote
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold py-2.5 rounded-lg transition-all">
                      <Send className="w-3.5 h-3.5" /> Send Quote
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <div className="text-[13px] text-gray-500 font-semibold">No quote yet</div>
                  <button className="mt-3 flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-[12px] font-bold px-4 py-2 rounded-lg transition-all mx-auto">
                    <Plus className="w-3.5 h-3.5" /> Create Quote
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#292B30] bg-[#111113] flex items-center gap-2">
          {lead.stage === 'Won' ? (
            <button className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white text-[13px] font-bold py-2.5 rounded-lg transition-all">
              <ChevronRight className="w-4 h-4" /> Convert to Project
            </button>
          ) : (
            <>
              {/* Update Stage Button */}
              <div className="relative flex-1">
                <button
                  onClick={() => setStageDropdownOpen(o => !o)}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold py-2.5 rounded-lg transition-all disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Update Stage
                  <ChevronDown className="w-4 h-4" />
                </button>
                {stageDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStageDropdownOpen(false)} />
                    <div className="absolute bottom-full left-0 right-0 mb-2 z-20 bg-[#1a1b1e] border border-[#292B30] rounded-xl overflow-hidden shadow-xl">
                      {LEAD_STAGES.map(stage => (
                        <button
                          key={stage}
                          onClick={() => handleStageChange(stage)}
                          className={`w-full text-left px-3 py-2 text-[12px] font-semibold hover:bg-yellow-400/10 transition-colors flex items-center gap-2 ${
                            stage === lead.stage ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${stageColors[stage]?.split(' ')[0]}`} />
                          {stage}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all">
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function InfoBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-[#0D0D0F] rounded-lg border border-[#292B30] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-gray-600" />
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-[12px] font-semibold text-white">{value || '—'}</span>
    </div>
  );
}
