import React, { useState } from 'react';
import { Search, Users, CreditCard, Droplet, ArrowRight, X } from 'lucide-react';
import api from '@/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AnalyticsSearchProps {
  onClose?: () => void;
}

export default function AnalyticsSearch({ onClose }: AnalyticsSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    residents: any[];
    communities: any[];
    bills: any[];
    readings: any[];
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Execute searches across major APIs
      const [resRes, billsRes, readingsRes] = await Promise.all([
        api.get('/api/residents', { params: { search: query, size: 5 } }),
        api.get('/api/billing/search', { params: { billNumber: query, size: 5 } }),
        api.get('/api/water/anomalies', { params: { size: 5 } }) // fallback search or matching logs
      ]);

      // Simple client-side mapping for communities or similar records
      setResults({
        residents: resRes.data?.content || [],
        communities: [], // fallback to local filters
        bills: billsRes.data?.content || [],
        readings: (readingsRes.data || []).filter((r: any) => 
          (r.residentName && r.residentName.toLowerCase().includes(query.toLowerCase())) ||
          (r.flat && r.flat.includes(query))
        ).slice(0, 5)
      });
    } catch  {
      toast.error('Global search encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <div className="bg-[#0b1f35] border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-2xl max-w-xl w-full mx-auto space-y-6 text-slate-200 select-none">
      
      <div className="flex justify-between items-center border-b border-[#17c8d8]/10 pb-3">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#17c8d8] flex items-center gap-2">
          <Search className="h-4 w-4" /> Global Analytics Search
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search residents, bill numbers, flats, usage logs..."
          className="w-full bg-[#071321] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-slate-200 font-bold placeholder-slate-500 focus:outline-none focus:border-[#17c8d8] text-xs"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#17c8d8] hover:bg-cyan-500 text-[#071321] font-extrabold px-3 py-1.5 rounded-xl text-xxs uppercase tracking-wider transition-all"
        >
          Go
        </button>
      </form>

      {/* Results view */}
      {loading ? (
        <div className="text-center py-8 text-slate-400 text-xxs uppercase font-black tracking-widest animate-pulse">
          Searching databases...
        </div>
      ) : results ? (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar text-xs font-bold">
          
          {/* Residents */}
          {results.residents.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block border-b border-white/5 pb-1 flex items-center gap-1">
                <Users className="h-3 w-3 text-[#17c8d8]" /> Residents
              </span>
              {results.residents.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleNavigate(`/admin/dashboard/residents/${r.id}`)}
                  className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                >
                  <span>{r.fullName} (Flat {r.flatNumber})</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                </div>
              ))}
            </div>
          )}

          {/* Bills / Invoices */}
          {results.bills.length > 0 && (
            <div className="space-y-2 mt-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block border-b border-white/5 pb-1 flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-emerald-400" /> Bills & Invoices
              </span>
              {results.bills.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleNavigate(`/admin/dashboard/billing/${b.id}`)}
                  className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                >
                  <span>{b.billNumber} — {b.residentName} ({b.status})</span>
                  <span className="text-emerald-400">₹{b.amount}</span>
                </div>
              ))}
            </div>
          )}

          {/* Readings */}
          {results.readings.length > 0 && (
            <div className="space-y-2 mt-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block border-b border-white/5 pb-1 flex items-center gap-1">
                <Droplet className="h-3 w-3 text-blue-400" /> Consumption Anomalies
              </span>
              {results.readings.map((r, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 text-slate-300"
                >
                  <span>Flat {r.flat} — {r.residentName}</span>
                  <span className="text-rose-400 font-extrabold">{r.usage} L (Anomaly)</span>
                </div>
              ))}
            </div>
          )}

          {results.residents.length === 0 && results.bills.length === 0 && results.readings.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs font-semibold">
              No matching records found.
            </div>
          )}

        </div>
      ) : null}

    </div>
  );
}
