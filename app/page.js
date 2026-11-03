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
  phone: '218910000000',
  custodyNo: 'CUS-2026-001'
};

const DEFAULT_FORM = {
  id: '',
  invoiceNumber: '',
  invoiceDate: '2026-11-03',
  vendor: '',
  description: '',
  amount: '',
  category: 'مواد بناء وتجهيزات',
  attachmentName: '',
  attachmentData: ''
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('custody');
  const [syncStatus, setSyncStatus] = useState('جاري الاتصال بالسحابة...');

  const [custodyFund, setCustodyFund] = useState(DEFAULT_FUND);
  const [invoices, setInvoices] = useState([]);
  const [custodyHistory, setCustodyHistory] = useState([]);
  const [showFundModal, setShowFundModal] = useState(false);
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
              attachmentData: String(item.attachment_data || '')
            };
          });
          setInvoices(mapped);
          setSyncStatus('🟢 متصل بالسحابة ومترابط حياً بين الكمبيوتر والجوال');
        }
      } else {
        setSyncStatus('⚠️ تعذر الجلب من السحابة (' + invRes.status + ')');
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
            phone: String(first.phone || ''),
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
    return function() {
      clearInterval(interval);
    };
  }, []);

  const totalSpent = invoices.reduce(function(acc, curr) {
    return acc + (parseFloat(curr.amount) || 0);
  }, 0);

  const remainingBalance = (parseFloat(custodyFund.amount) || 0) - totalSpent;

  function handleFileChange(e) {
    if (e && e.target && e.target.files && e.target.files.length > 0) {
      const file = e.target.files;
      const reader = new FileReader();
      reader.onloadend = function() {
        setFormData({
          id: formData.id,
          invoiceNumber: formData.invoiceNumber,
          invoiceDate: formData.invoiceDate,
          vendor: formData.vendor,
          description: formData.description,
          amount: formData.amount,
          category: formData.category,
          attachmentName: file.name,
          attachmentData: String(reader.result || '')
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
      attachment_data: formData.attachmentData || ''
    };

    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/invoices', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("✅ تم قيد الفاتورة وتزامنها سحابياً فوراً!");
        setFormData(DEFAULT_FORM);
        fetchCloudData();
      } else {
        alert("⚠️ فشل حفظ الفاتورة في السحابة");
      }
    } catch (err) {
      alert("خطأ اتصال: " + err.message);
    }
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

  function sendWhatsAppNotification(type, data) {
    const itemData = data || {};
    let text = '';
    const cleanPhone = custodyFund.phone ? custodyFund.phone.replace(/[^0-9]/g, '') : '';

    if (type === 'NEW_CUSTODY') {
      text = '📢 *إشعار استلام عهدة جديدة*\n\n👤 الأخ: ' + custodyFund.recipient + '\n🔢 رقم العهدة: ' + custodyFund.custodyNo + '\n💰 القيمة: ' + custodyFund.amount + ' ' + custodyFund.currency + '\n📅 التاريخ: ' + new Date().toLocaleDateString('ar-LY');
    } else if (type === 'FULL_REPORT') {
      text = '📋 *تقرير تسوية العهدة (' + custodyFund.custodyNo + ')*\n\n👤 المسؤول: ' + custodyFund.recipient + '\n💰 إجمالي العهدة: ' + custodyFund.amount + ' ' + custodyFund.currency + '\n🧾 المصروفات: ' + totalSpent + ' ' + custodyFund.currency + '\n💵 الصافي المتبقي: ' + remainingBalance + ' ' + custodyFund.currency;
    } else if (type === 'SINGLE_INVOICE') {
      text = '🧾 *إشعار فاتورة رقم ' + itemData.invoiceNumber + '*\n\n🏢 المورد: ' + (itemData.vendor || 'مباشر') + '\n💵 القيمة: ' + itemData.amount + ' ' + custodyFund.currency + '\n📊 الصافي المتبقي بالعهدة: ' + remainingBalance + ' ' + custodyFund.currency;
    }

    let waLink = '';
    if (cleanPhone) {
      waLink = '[suspicious link removed]' + cleanPhone + '&text=' + encodeURIComponent(text);
    } else {
      waLink = '[suspicious link removed]' + encodeURIComponent(text);
    }

    window.open(waLink, '_blank', 'noopener,noreferrer');
  }

  return (
    <div style={{ padding: '15px', fontFamily: 'system-ui, sans-serif', direction: 'rtl', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '18px', borderRadius: '12px', marginBottom: '15px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🏢 منظومة العهدة المالية والمصروفات المباشرة</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' }}>{syncStatus}</p>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button onClick={function() { setActiveTab('custody'); }} style={{ flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'custody' ? '#2563eb' : '#e2e8f0', color: activeTab === 'custody' ? 'white' : '#1e293b' }}>🏛️ لوحة التحكم والإدارة (الكمبيوتر)</button>
        <button onClick={function() { setActiveTab('delegate'); }} style={{ flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'delegate' ? '#16a34a' : '#e2e8f0', color: activeTab === 'delegate' ? 'white' : '#1e293b' }}>📱 واجهة المندوب / تسجيل فواتير الجوال</button>
      </div>

      {activeTab === 'custody' ? (
        <div>
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>📋 العهدة الحالية: {custodyFund.custodyNo}</h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>المسؤول: <strong>{custodyFund.recipient}</strong> {custodyFund.phone ? '(' + custodyFund.phone + ')' : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={function() { sendWhatsAppNotification('FULL_REPORT'); }} style={{ padding: '8px 12px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  💬 تقرير الواتساب
                </button>
                <button onClick={function() { sendWhatsAppNotification('NEW_CUSTODY'); }} style={{ padding: '8px 12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  📢 إشعار عهدة
                </button>
                <button onClick={function() { setShowFundModal(!showFundModal); }} style={{ padding: '8px 12px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>⚙️ تخصيص</button>
                <button onClick={handleCloseAndArchive} style={{ padding: '8px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔒 أرشفة</button>
              </div>
            </div>

            {showFundModal && (
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginTop: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  <input type="text" placeholder="اسم المسؤول" value={custodyFund.recipient} onChange={function(e) { setCustodyFund({ amount: custodyFund.amount, currency: custodyFund.currency, recipient: e.target.value, phone: custodyFund.phone, custodyNo: custodyFund.custodyNo }); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <input type="text" placeholder="رقم الهاتف (218...)" value={custodyFund.phone} onChange={function(e) { setCustodyFund({ amount: custodyFund.amount, currency: custodyFund.currency, recipient: custodyFund.recipient, phone: e.target.value, custodyNo: custodyFund.custodyNo }); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <input type="number" placeholder="مبلغ العهدة" value={custodyFund.amount} onChange={function(e) { setCustodyFund({ amount: parseFloat(e.target.value) || 0, currency: custodyFund.currency, recipient: custodyFund.recipient, phone: custodyFund.phone, custodyNo: custodyFund.custodyNo }); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <button onClick={function() { setShowFundModal(false); }} style={{ padding: '6px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>حفظ التعديلات</button>
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

          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr>
                  <th style={{ padding: '8px' }}>الفاتورة</th>
                  <th style={{ padding: '8px' }}>التاريخ</th>
                  <th style={{ padding: '8px' }}>المورد</th>
                  <th style={{ padding: '8px' }}>المبلغ</th>
                  <th style={{ padding: '8px' }}>المرفق</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>مشاركة واتساب</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#94a3b8' }}>لا توجد فواتير مسجلة حالياً في السحابة</td></tr>
                ) : (
                  invoices.map(function(inv) {
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: '8px' }}>{inv.invoiceDate}</td>
                        <td style={{ padding: '8px' }}>{inv.vendor || '-'}</td>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#dc2626' }}>{inv.amount ? inv.amount.toLocaleString() : '0'} {custodyFund.currency}</td>
                        <td style={{ padding: '8px' }}>{inv.attachmentData ? <a href={inv.attachmentData} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>📎 عرض الصورة</a> : 'لا يوجد'}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button onClick={function() { sendWhatsAppNotification('SINGLE_INVOICE', inv); }} style={{ padding: '4px 8px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                            💬 مشاركة
                          </button>
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
        <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#16a34a' }}>📱 واجهة تسجيل الفواتير من الجوال (تزامن سحابي)</h3>
          <form onSubmit={handleSubmitInvoice} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>رقم الفاتورة / الإيصال</label>
              <input type="text" placeholder="مثال: INV-1002" value={formData.invoiceNumber} onChange={function(e) { setFormData({ id: formData.id, invoiceNumber: e.target.value, invoiceDate: formData.invoiceDate, vendor: formData.vendor, description: formData.description, amount: formData.amount, category: formData.category, attachmentName: formData.attachmentName, attachmentData: formData.attachmentData }); }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>تاريخ الفاتورة</label>
              <input type="date" value={formData.invoiceDate} onChange={function(e) { setFormData({ id: formData.id, invoiceNumber: formData.invoiceNumber, invoiceDate: e.target.value, vendor: formData.vendor, description: formData.description, amount: formData.amount, category: formData.category, attachmentName: formData.attachmentName, attachmentData: formData.attachmentData }); }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>اسم المورد / المحل</label>
              <input type="text" placeholder="مثال: شركة المواد الجاهزة" value={formData.vendor} onChange={function(e) { setFormData({ id: formData.id, invoiceNumber: formData.invoiceNumber, invoiceDate: formData.invoiceDate, vendor: e.target.value, description: formData.description, amount: formData.amount, category: formData.category, attachmentName: formData.attachmentName, attachmentData: formData.attachmentData }); }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>المبلغ الإجمالي ({custodyFund.currency})</label>
              <input type="number" step="0.01" placeholder="مثال: 450" value={formData.amount} onChange={function(e) { setFormData({ id: formData.id, invoiceNumber: formData.invoiceNumber, invoiceDate: formData.invoiceDate, vendor: formData.vendor, description: formData.description, amount: e.target.value, category: formData.category, attachmentName: formData.attachmentName, attachmentData: formData.attachmentData }); }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>📷 تصوير / رفع الفاتورة</label>
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ width: '100%', padding: '6px', fontSize: '11px', marginTop: '4px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                💾 تسجيل الفاتورة وتزامنها سحابياً فوراً
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
