'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import CementPlantDashboard from '@/components/Dashboard';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <CementPlantDashboard />}
        {activeTab !== 'dashboard' && (
          <div className="p-12 text-center text-slate-400">
            <h2 className="text-xl font-bold mb-2 text-white">قسم {activeTab} قيد التطوير</h2>
            <p className="text-sm">يمكنك استخدام الأوامر الخمسة المخصصة لكلاود لتغذية هذا القسم بالمنطق البرمجي والواجهات المفصلة.</p>
          </div>
        )}
      </main>
    </div>
  );
}