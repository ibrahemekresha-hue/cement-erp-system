'use client';

import React, { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://qcklfbqlxtfddkxdtwrm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sFxpgljPq4vJWw54LtX2iA_hQWwqdlD';

const reqHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const DEFAULT_FUND = {
  amount: 50000,
  currency: 'LYD',
  recipient: 'أحمد الصالحي',
  recipientPhone: '',
  ownerPhone: '',
  custodyNo: 'CUS-2026-001'
};

const DEFAULT_FORM = {
  id: '',
  invoiceNumber: '',
  invoiceDate: '2026-11-04',
  vendor: '',
  description: '',
  amount: '',
  category: 'مواد بناء وتجهيزات',
  cwipComponent: ' الأنشطة المدنية والسور',
  attachmentName: '',
  attachmentData: ''
};

// المكونات الـ 9 لمصنع الأسمنت وميزانياتها المعتمدة بالدولار
const INITIAL_CWIP_COMPONENTS = [
  { id: 'cwip_1', name: '🏗️ الأعمال المدنية والسور', budgetUsd: 150000, UsefulLife: 30 },
  { id: 'cwip_2', name: '🔥 الفرن والمبرد (Kiln & Cooler)', budgetUsd: 350000, UsefulLife: 20 },
  { id: 'cwip_3', name: '⚙️ طواحين الخام والأسمنت (Mills)', budgetUsd: 200000, UsefulLife: 20 },
  { id: 'cwip_4', name: '🏔️ المحاجر والكسارات (Quarry)', budgetUsd: 120000, UsefulLife: 20 },
  { id: 'cwip_5', name: '📦 صوامع التخزين والتعبئة (Silos)', budgetUsd: 100000, UsefulLife: 25 },
  { id: 'cwip_6', name: '⚡ الكهربائية ونظم التحكم (Power)', budgetUsd: 90000, UsefulLife: 15 },
  { id: 'cwip_7', name: '🚰 مرافق الموقع والمنافع (Utilities)', budgetUsd: 60000, UsefulLife: 15 },
  { id: 'cwip_8', name: '🚛 خدمات الشحن والنقليات (Shipping)', budgetUsd: 80000, UsefulLife: 10 },
  { id: 'cwip_9', name: '📋 مصاريف التأسيس والهندسة (Pre-op)', budgetUsd: 50000, UsefulLife: 10 }
];

function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '218' + cleaned.substring(1);
  } else if (!cleaned.startsWith('218') && cleaned.length === 9) {
    cleaned = '218' + cleaned;
  }
  return cleaned;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('custody');
  const [adminSubTab, setAdminSubTab] = useState('custody_view');
  const [syncStatus, setSyncStatus] = useState('جاري الاتصال بالسحابة...');

  const [custodyFund, setCustodyFund] = useState(DEFAULT_FUND);
  const [invoices, setInvoices] = useState([]);
  const [custodyHistory, setCustodyHistory] = useState([]);
  const [advances, setAdvances] = useState([]);

  const [showFundModal, setShowFundModal] = useState(false);
  const [modalForm, setModalForm] = useState(DEFAULT_FUND);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  async function fetchCloudData() {
    try {
      const invRes = await fetch(SUPABASE_URL + '/rest/v1/invoices?select=*', { headers: reqHeaders });
      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData)) {
          const mapped = invData.map(function(item) {
            return {
              id: String(item.id || Date.now()),
              invoiceNumber: String(item.invoice_number || item.invoiceNumber || ''),
              invoiceDate: String(item.invoice_date || item.invoiceDate || ''),
              vendor: String(item.vendor || ''),
              amount: parseFloat(item.amount) || 0,
              category: String(item.category || 'عام'),
              cwipComponent: String(item.cwip_component || item.cwipComponent || '🏗️ الأعمال المدنية والسور'),
              attachmentData: String(item.attachment_data || item.attachmentData || '')
            };
          });
          setInvoices(mapped);
          setSyncStatus('🟢 متصل بالسحابة ومترابط حياً بين الكمبيوتر والجوال');
        }
      }

      const fundRes = await fetch(SUPABASE_URL + '/rest/v1/custody_fund?select=*', { headers: reqHeaders });
      if (fundRes.ok) {
        const fundData = await fundRes.json();
        if (Array.isArray(fundData) && fundData.length > 0) {
          const first = fundData;
          setCustodyFund({
            amount: parseFloat(first.amount) || 50000,
            currency: String(first.currency || 'LYD'),
            recipient: String(first.recipient || 'أحمد الصالحي'),
            recipientPhone: String(first.phone || first.recipient_phone || ''),
            ownerPhone: String(first.owner_phone || ''),
            custodyNo: String(first.custody_no || first.custodyNo || 'CUS-2026-001')
          });
        }
      }
    } catch (err) {
      setSyncStatus('❌ فشل الاتصال بالسحابة');
    }
  }

  useEffect(function() {
    fetchCloudData();
    const interval = setInterval(fetchCloudData, 3000);
    return function() { clearInterval(interval); };
  }, []);

  const totalSpent = invoices.reduce(function(acc, curr) { return acc + (parseFloat(curr.amount) || 0); }, 0);
  const remainingBalance = (parseFloat(custodyFund.amount) || 0) - totalSpent;

  function buildWhatsAppUrl(type, data) {
    const itemData = data || {};
    let text = '';
    let targetPhone = custodyFund.ownerPhone;
    if (type === 'NEW_CUSTODY') targetPhone = custodyFund.recipientPhone || custodyFund.ownerPhone;
    const formattedPhone = cleanPhoneNumber(targetPhone);

    if (type === 'NEW_CUSTODY') {
      text = '📢 *إشعار استلام عهدة جديدة*\n\n👤 مسؤول العهدة: ' + (custodyFund.recipient || '') + '\n🔢 رقم العهدة: ' + (custodyFund.custodyNo || '') + '\n💰 القيمة: ' + (custodyFund.amount || 0).toLocaleString() + ' ' + custodyFund.currency + '\n📅 التاريخ: ' + new Date().toLocaleDateString('ar-LY');
    } else if (type === 'FULL_REPORT') {
      text = '📋 *تقرير تسوية العهدة (' + (custodyFund.custodyNo || '') + ')*\n\n👤 مسؤول العهدة: ' + (custodyFund.recipient || '') + '\n💰 إجمالي العهدة: ' + (custodyFund.amount || 0).toLocaleString() + ' ' + custodyFund.currency + '\n🧾 المصروفات: ' + totalSpent.toLocaleString() + ' ' + custodyFund.currency + '\n💵 الصافي المتبقي: ' + remainingBalance.toLocaleString() + ' ' + custodyFund.currency;
    } else if (type === 'SINGLE_INVOICE') {
      text = '🧾 *إشعار فاتورة رقم ' + (itemData.invoiceNumber || '') + '*\n\n🏢 المورد: ' + (itemData.vendor || 'مباشر') + '\n💵 القيمة: ' + (itemData.amount || 0) + ' ' + custodyFund.currency + '\n📊 الصافي المتبقي بالعهدة: ' + remainingBalance.toLocaleString() + ' ' + custodyFund.currency;
    }

    const encodedText = encodeURIComponent(text);
    const p = 'ht' + 'tps://';
    const h = 'wa' + '.' + 'me/';
    const baseUrl = p + h;

    if (formattedPhone) return baseUrl + formattedPhone + '?text=' + encodedText;
    return baseUrl + '?text=' + encodedText;
  }

  return (
    <div style={{ padding: '15px', fontFamily: 'system-ui, sans-serif', direction: 'rtl', maxWidth: '1050px', margin: '0 auto' }}>
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '18px', borderRadius: '12px', marginBottom: '15px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🏢 منظومة العهدة المالية والأصول قيد التنفيذ (CWIP)</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' }}>{syncStatus}</p>
      </header>

      {/* الشريط الرئيسي للتنقل */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button onClick={function() { setActiveTab('custody'); }} style={{ flex: 1, padding: '12px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'custody' ? '#2563eb' : '#e2e8f0', color: activeTab === 'custody' ? 'white' : '#1e293b' }}>
          🏛️ لوحة التحكم والإدارة المالية
        </button>
        <button onClick={function() { setActiveTab('cwip'); }} style={{ flex: 1, padding: '12px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'cwip' ? '#0891b2' : '#e2e8f0', color: activeTab === 'cwip' ? 'white' : '#1e293b' }}>
          🏭 تبويب الأصول قيد التنفيذ (CWIP)
        </button>
        <button onClick={function() { setActiveTab('delegate'); }} style={{ flex: 1, padding: '12px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'delegate' ? '#16a34a' : '#e2e8f0', color: activeTab === 'delegate' ? 'white' : '#1e293b' }}>
          📱 واجهة المندوب (الجوال)
        </button>
      </div>

      {activeTab === 'custody' && (
        <div>
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>📋 العهدة الحالية: {custodyFund.custodyNo}</h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  مسؤول العهدة: <strong>{custodyFund.recipient}</strong> {custodyFund.recipientPhone ? '(' + custodyFund.recipientPhone + ')' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <a href={buildWhatsAppUrl('FULL_REPORT')} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#25D366', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>💬 تقرير الواتساب</a>
                <a href={buildWhatsAppUrl('NEW_CUSTODY')} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#0284c7', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>📢 إشعار عهدة</a>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '15px' }}>
            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', borderRight: '4px solid #2563eb' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>إجمالي العهدة</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{(custodyFund.amount || 0).toLocaleString()} {custodyFund.currency}</div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', borderRight: '4px solid #ef4444' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>المصروفات الحالية</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{totalSpent.toLocaleString()} {custodyFund.currency}</div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', borderRight: '4px solid #10b981' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>الرصيد المتبقي</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: remainingBalance >= 0 ? '#10b981' : '#dc2626' }}>{remainingBalance.toLocaleString()} {custodyFund.currency}</div>
            </div>
          </div>

          {/* جدول الفواتير وقيدها المباشر */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr>
                  <th style={{ padding: '8px' }}>الفاتورة</th>
                  <th style={{ padding: '8px' }}>المورد</th>
                  <th style={{ padding: '8px' }}>المكون قيد التنفيذ (CWIP)</th>
                  <th style={{ padding: '8px' }}>المبلغ</th>
                  <th style={{ padding: '8px' }}>المرفق</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#94a3b8' }}>لا توجد فواتير حية حتى الآن</td></tr>
                ) : (
                  invoices.map(function(inv) {
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: '8px' }}>{inv.vendor || '-'}</td>
                        <td style={{ padding: '8px', color: '#0891b2', fontWeight: 'bold' }}>{inv.cwipComponent}</td>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#dc2626' }}>{inv.amount.toLocaleString()} {custodyFund.currency}</td>
                        <td style={{ padding: '8px' }}>
                          {inv.attachmentData ? <a href={inv.attachmentData} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>📎 عرض الفاتورة</a> : 'لا يوجد'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🏭 الشاشة الجديدة: تبويب الأصول قيد التنفيذ (CWIP Module) */}
      {activeTab === 'cwip' && (
        <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#0891b2' }}>🏭 متابعة تكاليف ونسب إنجاز أصول المصنع قيد التنفيذ (IAS 16)</h3>
          <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#64748b' }}>
            توزيع وتجميع المصروفات المباشرة سحابياً على مكونات المصنع التسعة واحتساب نسب التوثيق والتجهيز للرأسمالة.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {INITIAL_CWIP_COMPONENTS.map(function(comp) {
              const compInvoices = invoices.filter(function(i) { return i.cwipComponent === comp.name; });
              const spentLyd = compInvoices.reduce(function(acc, c) { return acc + (c.amount || 0); }, 0);
              const budgetLyd = comp.budgetUsd * 8.50; // سعر الصرف التقديري 8.50 د.ل/دولار
              const progressPct = Math.min(100, Math.round((spentLyd / budgetLyd) * 100));

              return (
                <div key={comp.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', color: '#0f172a' }}>{comp.name}</h4>
                    <span style={{ fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      عمر الأصل: {comp.UsefulLife} سنة
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>
                    المصروف الإجمالي: <strong style={{ color: '#0891b2' }}>{spentLyd.toLocaleString()} LYD</strong>
                  </div>

                  {/* شريط نسبة التجهيز والإنجاز */}
                  <div style={{ backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                    <div style={{ backgroundColor: progressPct > 80 ? '#ef4444' : '#0891b2', width: progressPct + '%', height: '100%' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span>نسبة التكلفة: {progressPct}%</span>
                    <span>الميزانية: {budgetLyd.toLocaleString()} LYD</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* واجهة المندوب بالجوال */}
      {activeTab === 'delegate' && (
        <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#16a34a' }}>📱 واجهة تسجيل الفواتير المباشرة</h3>
          <p style={{ fontSize: '12px', color: '#15803d' }}>تسجيل الفاتورة واختيار مكون الأصل قيد التنفيذ فوراً من الموقع.</p>
        </div>
      )}
    </div>
  );
}
