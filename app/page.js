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
  cwipComponent: '🏗️ الأعمال المدنية والسور',
  attachmentName: '',
  attachmentData: ''
};

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
  
  // نموذج المرتبات المعدل بالحقول التفصيلية الجديدة
  const [advances, setAdvances] = useState([]);
  const [advanceForm, setAdvanceForm] = useState({ 
    employee: '', 
    basicSalary: '', 
    bonus: '', 
    deductions: '', 
    date: '2026-11-04', 
    notes: '' 
  });

  const [showFundModal, setShowFundModal] = useState(false);
  const [modalForm, setModalForm] = useState(DEFAULT_FUND);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  function handleOpenModal() {
    setModalForm({ ...custodyFund });
    setShowFundModal(true);
  }

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

      const histRes = await fetch(SUPABASE_URL + '/rest/v1/custody_history?select=*', { headers: reqHeaders });
      if (histRes.ok) {
        const histData = await histRes.json();
        if (Array.isArray(histData)) {
          const mappedHist = histData.map(function(h) {
            return {
              id: String(h.id || Date.now()),
              custodyNo: String(h.custody_no || h.custodyNo || ''),
              recipient: String(h.recipient || ''),
              totalAmount: parseFloat(h.total_amount || h.totalAmount) || 0,
              spentAmount: parseFloat(h.spent_amount || h.spentAmount) || 0,
              remainingAmount: parseFloat(h.remaining_amount || h.remainingAmount) || 0,
              currency: String(h.currency || 'LYD'),
              closedAt: String(h.closed_at || h.closedAt || '')
            };
          });
          setCustodyHistory(mappedHist);
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

  // الحساب الآلي للمبلغ المستحق
  const calculatedNet = (parseFloat(advanceForm.basicSalary) || 0) + (parseFloat(advanceForm.bonus) || 0) - (parseFloat(advanceForm.deductions) || 0);

  async function handleSaveFund() {
    const payload = {
      id: "1",
      custody_no: modalForm.custodyNo || 'CUS-2026-001',
      recipient: modalForm.recipient,
      phone: modalForm.recipientPhone,
      owner_phone: modalForm.ownerPhone,
      amount: parseFloat(modalForm.amount) || 0,
      currency: modalForm.currency || 'LYD'
    };

    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/custody_fund', {
        method: 'POST',
        headers: { ...reqHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("✅ تم حفظ وتخصيص بيانات العهدة سحابياً بنجاح!");
        setCustodyFund({ ...modalForm });
        setShowFundModal(false);
        fetchCloudData();
      } else {
        await fetch(SUPABASE_URL + '/rest/v1/custody_fund?id=eq.1', {
          method: 'PATCH',
          headers: reqHeaders,
          body: JSON.stringify(payload)
        });
        alert("✅ تم تحديث العهدة سحابياً!");
        setCustodyFund({ ...modalForm });
        setShowFundModal(false);
        fetchCloudData();
      }
    } catch (e) {
      alert("خطأ أثناء الحفظ: " + e.message);
    }
  }

  function handleAddAdvance(e) {
    e.preventDefault();
    if (!advanceForm.employee) {
      alert("يرجى كتابة اسم الموظف!");
      return;
    }
    const basic = parseFloat(advanceForm.basicSalary) || 0;
    const bonusVal = parseFloat(advanceForm.bonus) || 0;
    const dedVal = parseFloat(advanceForm.deductions) || 0;
    const netVal = basic + bonusVal - dedVal;

    const newAdv = {
      id: String(Date.now()),
      employee: advanceForm.employee,
      basicSalary: basic,
      bonus: bonusVal,
      deductions: dedVal,
      netAmount: netVal,
      date: advanceForm.date,
      notes: advanceForm.notes
    };

    setAdvances([newAdv, ...advances]);
    setAdvanceForm({ employee: '', basicSalary: '', bonus: '', deductions: '', date: '2026-11-04', notes: '' });
    alert("✅ تم قيد استحقاق الراتب وتفاصيله بنجاح!");
  }

  async function handleCloseAndArchive() {
    const confirmMsg = "هل أنت متأكد من إغلاق العهدة (" + custodyFund.custodyNo + ") وأرشفتها؟";
    if (confirm(confirmMsg)) {
      const archivePayload = {
        id: String(Date.now()),
        custody_no: custodyFund.custodyNo,
        recipient: custodyFund.recipient,
        total_amount: custodyFund.amount,
        spent_amount: totalSpent,
        remaining_amount: remainingBalance,
        currency: custodyFund.currency,
        closed_at: new Date().toLocaleDateString('ar-LY')
      };

      try {
        await fetch(SUPABASE_URL + '/rest/v1/custody_history', {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify(archivePayload)
        });

        await fetch(SUPABASE_URL + '/rest/v1/invoices?id=neq.0', {
          method: 'DELETE',
          headers: reqHeaders
        });
        
        fetchCloudData();
        alert("✅ تم أرشفة العهدة بنجاح وبدء عهدة جديدة!");
      } catch (err) {
        alert("تعذر الأرشفة: " + err.message);
      }
    }
  }

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

  function handleFileChange(e) {
    if (e && e.target && e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(event) {
        const rawResult = event.target.result;
        setFormData(function(prev) {
          return {
            ...prev,
            attachmentName: file.name,
            attachmentData: String(rawResult || '')
          };
        });
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmitInvoice(e) {
    e.preventDefault();
    if (!formData.invoiceNumber || !formData.amount) {
      alert("يرجى إدخال رقم الفاتورة والمبلغ!");
      return;
    }

    const newId = String(Date.now());
    const payload = {
      id: newId,
      invoice_number: formData.invoiceNumber,
      invoice_date: formData.invoiceDate,
      vendor: formData.vendor,
      amount: parseFloat(formData.amount),
      category: formData.category,
      cwip_component: formData.cwipComponent,
      attachment_data: formData.attachmentData || ''
    };

    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/invoices', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("✅ تم قيد الفاتورة وتزامنها سحابياً بنجاح!");
        setFormData(DEFAULT_FORM);
        fetchCloudData();
      } else {
        alert("⚠️ تعذر قيد الفاتورة في السحابة.");
      }
    } catch (err) {
      alert("خطأ اتصال: " + err.message);
    }
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
          {/* التبويبات الفرعية في لوحة التحكم */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            <button onClick={function() { setAdminSubTab('custody_view'); }} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: adminSubTab === 'custody_view' ? '#0f172a' : '#cbd5e1', color: adminSubTab === 'custody_view' ? 'white' : '#334155' }}>
              📋 تسوية العهدة والمصروفات
            </button>
            <button onClick={function() { setAdminSubTab('salaries_view'); }} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: adminSubTab === 'salaries_view' ? '#0f172a' : '#cbd5e1', color: adminSubTab === 'salaries_view' ? 'white' : '#334155' }}>
              💵 إدارة المرتبات والاستحقاقات
            </button>
          </div>

          {adminSubTab === 'custody_view' ? (
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
                    <button onClick={handleOpenModal} style={{ padding: '8px 12px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>⚙️ تخصيص عهدة جديدة</button>
                    <button onClick={handleCloseAndArchive} style={{ padding: '8px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔒 أرشفة</button>
                  </div>
                </div>

                {showFundModal && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', marginTop: '12px', border: '1px solid #cbd5e1' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '14px' }}>⚙️ تخصيص بيانات عهدة جديدة وأرقام الجوال:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>🔢 رقم العهدة</label>
                        <input type="text" value={modalForm.custodyNo} onChange={function(e) { setModalForm({ ...modalForm, custodyNo: e.target.value }); }} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>👤 اسم مسؤول العهدة (المندوب)</label>
                        <input type="text" value={modalForm.recipient} onChange={function(e) { setModalForm({ ...modalForm, recipient: e.target.value }); }} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>📱 جوال مسؤول العهدة (واتساب)</label>
                        <input type="text" placeholder="مثال: 0910000000" value={modalForm.recipientPhone} onChange={function(e) { setModalForm({ ...modalForm, recipientPhone: e.target.value }); }} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>🏢 جوال صاحب المنظومة / الإدارة</label>
                        <input type="text" placeholder="مثال: 0920000000" value={modalForm.ownerPhone} onChange={function(e) { setModalForm({ ...modalForm, ownerPhone: e.target.value }); }} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>💰 مبلغ العهدة الكلي</label>
                        <input type="number" value={modalForm.amount} onChange={function(e) { setModalForm({ ...modalForm, amount: e.target.value }); }} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '5px' }}>
                        <button onClick={handleSaveFund} style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>💾 حفظ سحابياً</button>
                        <button onClick={function() { setShowFundModal(false); }} style={{ padding: '8px 14px', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>إلغاء</button>
                      </div>
                    </div>
                  </div>
                )}
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

              {/* جدول الفواتير */}
              <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#f1f5f9' }}>
                    <tr>
                      <th style={{ padding: '8px' }}>الفاتورة</th>
                      <th style={{ padding: '8px' }}>المورد</th>
                      <th style={{ padding: '8px' }}>المكون قيد التنفيذ (CWIP)</th>
                      <th style={{ padding: '8px' }}>المبلغ</th>
                      <th style={{ padding: '8px' }}>المرفق</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>مشاركة واتساب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#94a3b8' }}>لا توجد فواتير حية حتى الآن</td></tr>
                    ) : (
                      invoices.map(function(inv) {
                        return (
                          <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                            <td style={{ padding: '8px' }}>{inv.vendor || '-'}</td>
                            <td style={{ padding: '8px', color: '#0891b2', fontWeight: 'bold' }}>{inv.cwipComponent}</td>
                            <td style={{ padding: '8px', fontWeight: 'bold', color: '#dc2626' }}>{inv.amount.toLocaleString()} {custodyFund.currency}</td>
                            <td style={{ padding: '8px' }}>
                              {inv.attachmentData && inv.attachmentData.length > 10 ? (
                                <a href={inv.attachmentData} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 'bold' }}>📎 عرض الفاتورة</a>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>لا يوجد</span>
                              )}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <a href={buildWhatsAppUrl('SINGLE_INVOICE', inv)} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 8px', backgroundColor: '#25D366', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
                                💬 مشاركة
                              </a>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {custodyHistory.length > 0 && (
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>📦 أرشيف العهد المغلقة ({custodyHistory.length})</h4>
                  {custodyHistory.map(function(rec) {
                    return (
                      <div key={rec.id} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span><strong>{rec.custodyNo}</strong> ({rec.recipient}) - المصروف: {rec.spentAmount} {rec.currency} - الصافي: {rec.remainingAmount} {rec.currency}</span>
                        <span style={{ color: '#64748b' }}>📅 {rec.closedAt}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* 💵 الشاشة المحدثة: إدارة المرتبات والاستحقاقات بالحقول الخمسة */
            <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <h3 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>💵 كشف المرتبات، الإضافي، والخصومات (استحقاق العمالة)</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#64748b' }}>
                احتساب المرتب الأساسي، المكافآت/الإضافي، والاستقطاعات لحساب المبلغ الصافي المستحق تلقائياً.
              </p>

              <form onSubmit={handleAddAdvance} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>👤 اسم الموظف / المستفيد</label>
                  <input type="text" placeholder="مثال: علي سالم" value={advanceForm.employee} onChange={function(e) { setAdvanceForm({ ...advanceForm, employee: e.target.value }); }} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '3px' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>💵 المرتب الأساسي ({custodyFund.currency})</label>
                  <input type="number" placeholder="مثال: 3000" value={advanceForm.basicSalary} onChange={function(e) { setAdvanceForm({ ...advanceForm, basicSalary: e.target.value }); }} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '3px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a' }}>➕ إضافي / مكافأة عمل</label>
                  <input type="number" placeholder="مثال: 500" value={advanceForm.bonus} onChange={function(e) { setAdvanceForm({ ...advanceForm, bonus: e.target.value }); }} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '3px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626' }}>➖ قيمة الخصم / الاستقطاع</label>
                  <input type="number" placeholder="مثال: 200" value={advanceForm.deductions} onChange={function(e) { setAdvanceForm({ ...advanceForm, deductions: e.target.value }); }} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '3px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb' }}>📊 المبلغ المستحق (الصافي)</label>
                  <input type="number" value={calculatedNet} readOnly style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#eff6ff', fontWeight: 'bold', color: '#1d4ed8', marginTop: '3px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>📅 تاريخ الاستحقاق</label>
                  <input type="date" value={advanceForm.date} onChange={function(e) { setAdvanceForm({ ...advanceForm, date: e.target.value }); }} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '3px' }} />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '5px' }}>
                  <button type="submit" style={{ padding: '9px 18px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                    ➕ قيد استحقاق الراتب والتحليلات
                  </button>
                </div>
              </form>

              <h4 style={{ margin: '15px 0 8px 0', fontSize: '14px', color: '#1e293b' }}>جدول كشف المرتبات والاستحقاقات المقيدة:</h4>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#f1f5f9' }}>
                    <tr>
                      <th style={{ padding: '8px' }}>الموظف / المستفيد</th>
                      <th style={{ padding: '8px' }}>المرتب الأساسي</th>
                      <th style={{ padding: '8px' }}>الإضافي / المكافأة</th>
                      <th style={{ padding: '8px' }}>الخصوم والخصم</th>
                      <th style={{ padding: '8px' }}>الصافي المستحق</th>
                      <th style={{ padding: '8px' }}>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#94a3b8' }}>لا توجد مرتبات أو استحقاقات مقيدة حتى الآن</td></tr>
                    ) : (
                      advances.map(function(adv) {
                        return (
                          <tr key={adv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{adv.employee}</td>
                            <td style={{ padding: '8px' }}>{(adv.basicSalary || 0).toLocaleString()} {custodyFund.currency}</td>
                            <td style={{ padding: '8px', color: '#16a34a', fontWeight: 'bold' }}>+{(adv.bonus || 0).toLocaleString()} {custodyFund.currency}</td>
                            <td style={{ padding: '8px', color: '#dc2626' }}>-{(adv.deductions || 0).toLocaleString()} {custodyFund.currency}</td>
                            <td style={{ padding: '8px', color: '#2563eb', fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
                              {(adv.netAmount || 0).toLocaleString()} {custodyFund.currency}
                            </td>
                            <td style={{ padding: '8px', color: '#64748b' }}>{adv.date}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🏭 تبويب الأصول قيد التنفيذ (CWIP Module) */}
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
              const budgetLyd = comp.budgetUsd * 8.50;
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
          <h3 style={{ margin: '0 0 12px 0', color: '#16a34a' }}>📱 واجهة تسجيل الفواتير المباشرة من الجوال</h3>
          <form onSubmit={handleSubmitInvoice} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>رقم الفاتورة / الإيصال</label>
              <input type="text" placeholder="مثال: INV-1002" value={formData.invoiceNumber} onChange={function(e) { setFormData({ ...formData, invoiceNumber: e.target.value }); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>تاريخ الفاتورة</label>
              <input type="date" value={formData.invoiceDate} onChange={function(e) { setFormData({ ...formData, invoiceDate: e.target.value }); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>اسم المورد / المحل</label>
              <input type="text" placeholder="مثال: شركة المواد الجاهزة" value={formData.vendor} onChange={function(e) { setFormData({ ...formData, vendor: e.target.value }); }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>المكون قيد التنفيذ (CWIP)</label>
              <select value={formData.cwipComponent} onChange={function(e) { setFormData({ ...formData, cwipComponent: e.target.value }); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', backgroundColor: 'white' }}>
                {INITIAL_CWIP_COMPONENTS.map(function(c) {
                  return <option key={c.id} value={c.name}>{c.name}</option>;
                })}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>المبلغ الإجمالي ({custodyFund.currency})</label>
              <input type="number" step="0.01" placeholder="مثال: 450" value={formData.amount} onChange={function(e) { setFormData({ ...formData, amount: e.target.value }); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>📷 تصوير / رفع صورة الفاتورة</label>
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ width: '100%', padding: '8px', fontSize: '12px', marginTop: '4px' }} />
            </div>
            <div style={{ marginTop: '10px' }}>
              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                💾 تسجيل الفاتورة وإرسالها سحابياً فوراً
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
