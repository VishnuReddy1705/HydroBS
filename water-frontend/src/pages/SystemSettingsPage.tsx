import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Globe, DollarSign, Clock, HelpCircle, Shield, Sliders, RefreshCw } from 'lucide-react';
import api from '@/api';
import { toast } from 'sonner';

interface SystemSettingItem {
  id: number;
  settingKey: string;
  settingValue: string;
  description: string;
  category: string;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('GENERAL'); // GENERAL, BILLING, SECURITY

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/settings');
      setSettings(res.data || []);
    } catch (err) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings(prev => prev.map(s => s.settingKey === key ? { ...s, settingValue: val } : s));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Map back to key -> value map
      const payload: Record<String, String> = {};
      settings.forEach(s => {
        payload[s.settingKey] = s.settingValue;
      });

      await api.post('/api/settings', payload);
      toast.success('System configurations updated successfully');
    } catch (err) {
      toast.error('Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  // Filter settings by category
  const filtered = settings.filter(s => s.category === activeTab);

  return (
    <div className="space-y-6 text-[#1F2937] dot-grid-bg animate-fade-in select-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold gradient-text-animated">Global System Settings</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Configure platform defaults, currency standards, billing periods, and security rules</p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0F4C81] hover:text-[#00B4D8] bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-1 bg-white/70 p-2 rounded-3xl border border-slate-100 h-fit">
          {[
            { id: 'GENERAL', label: 'General Variables', icon: Sliders },
            { id: 'BILLING', label: 'Billing Defaults', icon: DollarSign },
            { id: 'SECURITY', label: 'Security & Auth', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xxs font-extrabold uppercase tracking-wider text-left transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0F4C81] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="clay-card p-6 border border-slate-100 space-y-6 bg-white">
            <h4 className="text-xs font-extrabold text-[#0F4C81] uppercase tracking-wider border-b border-slate-100 pb-3">
              {activeTab} Configurations
            </h4>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No configurations found under this category. Seeding defaults...
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(setting => (
                  <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-1">
                    <div>
                      <span className="block text-xxs font-extrabold text-slate-700 uppercase tracking-wider">{setting.settingKey}</span>
                      <span className="block text-[10px] text-slate-400 font-bold mt-0.5">{setting.description}</span>
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={setting.settingValue}
                        onChange={(e) => handleChange(setting.settingKey, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:bg-white focus:border-[#00B4D8] transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C81] hover:bg-[#00B4D8] text-white text-xxs font-extrabold rounded-xl uppercase tracking-wider transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving Changes
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

    </div>
  );
}
