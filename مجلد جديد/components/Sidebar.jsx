'use client';
import React from 'react';
import { 
  HomeIcon, 
  BanknotesIcon, 
  BuildingOffice2Icon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'اللوحة الرئيسية', icon: HomeIcon },
    { id: 'custody', label: 'تسوية العهد المزدوجة', icon: BanknotesIcon },
    { id: 'cwip', label: 'أصول قيد التنفيذ (CWIP)', icon: BuildingOffice2Icon },
    { id: 'reports', label: 'التقارير المالية IFRS', icon: ChartBarIcon },
    { id: 'settings', label: 'إعدادات المنظومة', icon: Cog6ToothIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col justify-between p-4 min-h-screen">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
            ك
          </div>
          <div>
            <h2 className="font-bold text-white text-base leading-tight">مصنع الكوت</h2>
            <p className="text-xs text-blue-400 font-medium">نظام ERP الصناعي</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
          <span>حالة النظام: متصل (SaaS)</span>
        </div>
        <div className="text-[11px] text-slate-500">الإصدار 1.0.0 · متوافق مع IFRS</div>
      </div>
    </aside>
  );
}