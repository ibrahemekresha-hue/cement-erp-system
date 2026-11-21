'use client';
import React, { useState } from 'react';
import { 
  BuildingOffice2Icon, 
  BanknotesIcon, 
  DocumentCheckIcon, 
  ScaleIcon, 
  ArrowPathIcon,
  ChartPieIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function CementPlantDashboard() {
  const [exchangeRate, setExchangeRate] = useState(8.53);
  
  const stats = {
    totalCustodyUSD: 55000.00,
    totalCustodyLYD: 469150.00,
    totalSpentUSD: 54980.54,
    totalSpentLYD: 468984.00,
    remainingUSD: 19.46,
    remainingLYD: 166.00,
    invoicedPercentage: 62.8,
  };

  const cwipBreakdown = [
    { component: 'شحن الكلنكر واللوجستيات', lyd: 370000, usd: 43376.32, color: 'bg-blue-600', percent: 78.9 },
    { component: 'الأعمال المدنية والسور', lyd: 25000, usd: 2930.83, color: 'bg-indigo-500', percent: 5.3 },
    { component: 'تأجير المعدات والفرارة', lyd: 32250, usd: 3780.77, color: 'bg-amber-500', percent: 6.9 },
    { component: 'أجور وإعاشة العمالة والخبراء', lyd: 20763, usd: 2434.11, color: 'bg-emerald-500', percent: 4.4 },
    { component: 'المواد البنائية والأثاث والمكتبيات', lyd: 20971, usd: 2458.51, color: 'bg-slate-400', percent: 4.5 },
  ];

  return (
    <div className="p-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <BuildingOffice2Icon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">لوحة تحكم مصنع الكوت للأسمنت</h1>
              <p className="text-sm text-slate-400">متابعة العهد المالية والأصول قيد التنفيذ (CWIP)</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-xl">
            <ArrowPathIcon className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">سعر الصرف:</span>
            <span className="text-sm font-semibold text-emerald-400">1 USD = {exchangeRate} LYD</span>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20">
            <PlusIcon className="w-4 h-4" />
            <span>إضافة بند عهدة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-400">إجمالي العهدة المخصصة</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><BanknotesIcon className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">${stats.totalCustodyUSD.toLocaleString()}</div>
          <div className="text-xs text-slate-400 font-mono">{stats.totalCustodyLYD.toLocaleString()} د.ل</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-400">إجمالي المصروفات الفعلية</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><ScaleIcon className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">${stats.totalSpentUSD.toLocaleString()}</div>
          <div className="text-xs text-slate-400 font-mono">{stats.totalSpentLYD.toLocaleString()} د.ل</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-400">المتبقي الفعلي في العهدة</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><BanknotesIcon className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mb-1">${stats.remainingUSD.toFixed(2)}</div>
          <div className="text-xs text-slate-400 font-mono">{stats.remainingLYD.toFixed(2)} د.ل</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-400">نسبة التوثيق بالفواتير</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><DocumentCheckIcon className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold text-indigo-300 mb-1">{stats.invoicedPercentage}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${stats.invoicedPercentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* CWIP Capital Allocation Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <ChartPieIcon className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">توزيع التكاليف الرأسمالية (CWIP Asset Allocation)</h2>
        </div>

        <div className="space-y-4">
          {cwipBreakdown.map((item, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-200">{item.component}</span>
                <div className="flex gap-4 text-xs font-mono">
                  <span className="text-slate-300">{item.lyd.toLocaleString()} د.ل</span>
                  <span className="text-blue-400">${item.usd.toLocaleString()}</span>
                  <span className="text-slate-400 font-bold">{item.percent}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.percent}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}