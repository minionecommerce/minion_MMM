'use client';

import { useState, useTransition } from 'react';
import { X, Upload, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { importLeads } from '@/app/actions/crm';

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_CSV = `Customer Name,Phone,Email,Location,Requirement,Budget,Customer Type,Source
John Smith,+91 98765 43210,john@example.com,Anna Nagar Chennai,Home Automation for villa,₹6–8L,Individual,Referral
ABC Builders,+91 87654 32109,contact@abc.com,Velachery Chennai,Landscape + Automation for 10 units,₹15L+,Builder,Exhibition`;

export default function ImportModal({ onClose, onSuccess }: ImportModalProps) {
  const [isPending, startTransition] = useTransition();
  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvText(evt.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return {
        customerName: row['customer name'] || row['name'] || '',
        phone: row['phone'] || row['mobile'] || '',
        email: row['email'] || '',
        location: row['location'] || row['site location'] || '',
        requirement: row['requirement'] || '',
        budget: row['budget'] || '',
        customerType: row['customer type'] || row['type'] || 'Individual',
        source: row['source'] || 'Import',
      };
    }).filter(r => r.customerName);
  };

  const handleImport = () => {
    if (!csvText.trim()) return;
    const rows = parseCSV(csvText);
    if (rows.length === 0) return;

    startTransition(async () => {
      try {
        const res = await importLeads(rows);
        setResult(res as any);
        if (res.imported > 0) {
          setTimeout(() => onSuccess(), 2000);
        }
      } catch (err: any) {
        setResult({ imported: 0, skipped: 0, errors: [err.message || 'Import failed'] });
      }
    });
  };

  const rows = csvText ? parseCSV(csvText) : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[560px] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
              <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Import Leads</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {result ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <div className="text-[14px] font-bold text-white">Import Complete!</div>
                    <div className="text-[12px] text-gray-400 mt-0.5">
                      {result.imported} leads imported · {result.skipped} skipped
                    </div>
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-red-400 mb-1">Errors:</div>
                    {result.errors.slice(0, 5).map((e, i) => (
                      <div key={i} className="text-[11px] text-red-300">{e}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Download Template */}
                <div className="flex items-center justify-between bg-[#0D0D0F] border border-[#292B30] rounded-xl p-4">
                  <div>
                    <div className="text-[13px] font-bold text-white">CSV Template</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Required columns: Customer Name, Phone, Email, Location, Requirement, Budget</div>
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'crm_leads_template.csv';
                      a.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 rounded-lg text-[11px] font-semibold hover:bg-yellow-400/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block w-full border-2 border-dashed border-[#292B30] hover:border-yellow-400/40 rounded-xl p-6 text-center cursor-pointer transition-all">
                    <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <div className="text-[13px] font-semibold text-gray-400">Click to upload CSV file</div>
                    <div className="text-[11px] text-gray-600 mt-1">or paste CSV content below</div>
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                {/* Paste CSV */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Or paste CSV data:</label>
                  <textarea
                    rows={5}
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    placeholder={SAMPLE_CSV}
                    className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[11px] font-mono text-gray-300 placeholder-gray-700 focus:outline-none focus:border-yellow-400/50 transition-colors resize-none"
                  />
                </div>

                {/* Preview */}
                {rows.length > 0 && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                    <div className="text-[12px] font-bold text-green-400 mb-1">{rows.length} leads ready to import</div>
                    {rows.slice(0, 3).map((r, i) => (
                      <div key={i} className="text-[11px] text-gray-500">{r.customerName} · {r.phone}</div>
                    ))}
                    {rows.length > 3 && <div className="text-[11px] text-gray-600 mt-1">+{rows.length - 3} more...</div>}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isPending || rows.length === 0}
                    className="flex-1 py-2.5 rounded-lg text-[13px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isPending ? 'Importing...' : `Import ${rows.length} Leads`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
