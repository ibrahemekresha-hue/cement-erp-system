'use client';

import React, { useState, useEffect } from 'react';

const SUPABASE_URL = '[suspicious link removed]';
const SUPABASE_KEY = 'sb_publishable_sFxpgljPq4vJWw54LtX2iA_hQWwqdlD';

const reqHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ verticalAlign: 'middle', marginLeft: '6px' }}>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('custody');
  const [syncStatus, setSyncStatus] = useState('جاري الاتصال بالسحابة...');

  const [custodyFund, setCustodyFund] = useState({
    amount: 50000,
    currency: 'LYD',
    recipient: 'أحمد الصالحي',
    phone: '218910000000',
    custodyNo: 'CUS-2026-001'
  });

  const [invoices, setInvoices] = useState([]);
  const [custodyHistory, setCustodyHistory] = useState([]);
  const [showFundModal, setShowFundModal] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    invoiceNumber: '',
    invoiceDate: '2026-11-03',
    vendor: '',
    description: '',
    amount: '',
    category: 'مواد بناء وتجهيزات',
    attachmentName: '',
    attachmentData: ''
  });

  const fetchCloudData = async () => {
    try {
      const invRes = await fetch(SUPABASE_URL + '/rest/v1/invoices?select=*', { headers: reqHeaders });
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.map(function(item) {
          return {
            id: item.id || String(Date.now()),
            invoiceNumber: item.invoice_number || item.invoiceNumber || '',
            invoiceDate: item.invoice_date || item.invoiceDate || '',
            vendor: item.vendor || '',
            amount: parseFloat(item.amount) || 0,
            category: item.category || 'عام',
            attachmentData: item.attachment_data || ''
          };
        }));
        setSyncStatus('🟢 متصل بالسحابة ومترابط حياً بين الكمبيوتر والجوال');
      } else {
        setSyncStatus('⚠️ تعذر الجلب من السحابة (' + invRes.status + ')');
      }

      const fundRes = await fetch(SUPABASE_URL + '/rest/v1/custody_fund?select=*', { headers: reqHeaders });
      if (fundRes.ok) {
        const fundData = await fundRes.json();
        if (fundData && fundData.length > 0) {
          const first = fundData[0];
          setCustodyFund({
            amount: parseFloat(first.amount) || 50000,
            currency: first.currency || 'LYD',
            recipient: first.recipient || 'أحمد الصالحي',
            phone: first.phone || '',
            custodyNo: first.custody_no || first.custodyNo || 'CUS-2026-001'
          });
        }
      }

      const histRes = await fetch(SUPABASE_URL + '/rest/v1/custody_history?select=*', { headers: reqHeaders });
      if (histRes.ok) {
        const histData = await histRes.json();
        setCustodyHistory(histData.map(function(h) {
          return {
            id: h.id,
            custodyNo: h.custody_no || h.custodyNo,
            recipient: h.recipient,
            totalAmount: parseFloat(h.total_amount || h.totalAmount) || 0,
            spentAmount: parseFloat(h.spent_amount || h.spentAmount) || 0,
            remainingAmount: parseFloat(h.remaining_amount || h.remainingAmount) || 0,
            currency: h.currency || 'LYD',
            closedAt: h.closed_at || h.closedAt || ''
          };
        }));
      }
    } catch (err) {
      setSyncStatus('❌ فشل الاتصال بالسحابة');
    }
  };

  useEffect(() => {
    fetchCloudData();
    const interval = setInterval(fetchCloudData, 3000);
    return function() { clearInterval(interval); };
  }, []);

  const totalSpent = invoices.reduce(function(acc, curr) {
    return acc + (parseFloat(curr.amount) || 0);
  }, 0);
  const remainingBalance = (parseFloat(custodyFund.amount) || 0) - totalSpent;

  const handleFileChange = (e) => {
    if (e.target && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = function() {
        setFormData(function(prev) {
          return { ...prev, attachmentName: file.name, attachmentData: reader.result };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitInvoice = async (e) => {
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
        setFormData({
          id: '',
          invoiceNumber: '',
          invoiceDate: '2026-11-03',
          vendor: '',
          description: '',
          amount: '',
          category: 'مواد بناء وتجهيزات',
          attachmentName: '',
          attachmentData: ''
        });
        fetchCloudData();
      } else {
        alert("⚠️ فشل حفظ الفاتورة في السحابة");
      }
    } catch (err) {
      alert("خطأ اتصال: " + err.message);
    }
  };

  const handleCloseAndArchive = async () => {
    if (confirm("هل أنت متأكد من إغلاق العهدة (" + custodyFund.custodyNo + ") وأرشفتها؟")) {
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

        await fetch(SUPABASE_URL + '/rest/v1/invoices?id=neq.0', { method: 'DELETE', headers: reqHeaders });
        
        fetchCloudData();
        alert("✅ تم أرشفة العهدة بنجاح وبدء عهدة جديدة!");
      } catch (err) {
        alert("تعذر الأرشفة: " + err.message);
      }
    }
  };

  const sendWhatsAppNotification = (type, data) => {
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

    const waLink = cleanPhone 
      ? '[suspicious link removed]' + cleanPhone + '&text=' + encodeURIComponent(text)
      : '[suspicious link removed]' + encodeURIComponent(text);

    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ padding: '15px', fontFamily: 'system-ui, sans-serif', direction: 'rtl', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '18px', borderRadius: '12px', marginBottom: '15px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🏢 منظومة العهدة المالية والمصروفات المباشرة</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' }}>{syncStatus}</p>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('custody')} style={{ flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'custody' ? '#2563eb' : '#e2e8f0', color: activeTab === 'custody' ? 'white' : '#1e293b' }}>🏛️ لوحة التحكم والإدارة (الكمبيوتر)</button>
        <button onClick={() => setActiveTab('delegate')} style={{ flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'delegate' ? '#16a34a' : '#e2e8f0', color: activeTab === 'delegate' ? 'white' : '#1e293b' }}>📱 واجهة المندوب / تسجيل فواتير الجوال</button>
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
                <button onClick={() => sendWhatsAppNotification('FULL_REPORT')} style={{ padding: '8px 12px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center' }}>
                  <WhatsAppIcon /> تقرير الواتساب
                </button>
                <button onClick={() => sendWhatsAppNotification('NEW_CUSTODY')} style={{ padding: '8px 12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center' }}>
                  <WhatsAppIcon /> إشعار عهدة
                </button>
                <button onClick={() => setShowFundModal(!showFundModal)} style={{ padding: '8px 12px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>⚙️ تخصيص</button>
                <button onClick={handleCloseAndArchive} style={{ padding: '8px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px',
