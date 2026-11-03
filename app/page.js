'use client';

import React, { useState, useEffect } from 'react';

// إعدادات الربط السحابي مع Supabase
const SUPABASE_URL = '[suspicious link removed]';
const SUPABASE_KEY = 'sb_publishable_sFxpgljPq4vJWw54LtX2iA_hQWwqdlD';

const reqHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// أيقونة الواتساب الرسمية SVG
const WhatsAppIcon = ({ size = 18, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ verticalAlign: 'middle', marginLeft: '6px' }}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState('custody');
  const [syncStatus, setSyncStatus] = useState('جاري الاتصال...');

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
    id: '', invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0],
    vendor: '', description: '', amount: '', category: 'CWIP - أصول قيد التنفيذ',
    attachmentName: '', attachmentData: ''
  });

  // جلب البيانات والتزامن السحابي
  const fetchCloudData = async () => {
    try {
      // 1. جلب الفواتير
      const invRes = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=*&order=created_at.desc`, { headers: reqHeaders });
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.map(item => ({
          id: item.id,
          invoiceNumber: item.invoice_number,
          invoiceDate: item.invoice_date,
          vendor: item.vendor,
          amount: parseFloat(item.amount) || 0,
          category: item.category,
          attachmentData: item.attachment_data
        })));
        setSyncStatus('🟢 متصل بالسحابة ومترابط حياً');
      } else {
        setSyncStatus(`⚠️ خطأ أمان بالسحابة (${invRes.status})`);
      }

      // 2. جلب بيانات العهدة
      const fundRes = await fetch(`${SUPABASE_URL}/rest/v1/custody_fund?select=*&id=eq.1`, { headers: reqHeaders });
      if (fundRes.ok) {
        const fundData = await fundRes.json();
        if (fundData && fundData.length > 0) {
          setCustodyFund({
            amount: parseFloat(fundData[0].amount) || 50000,
            currency: fundData[0].currency || 'LYD',
            recipient: fundData[0].recipient || 'أحمد الصالحي',
            phone: fundData[0].phone || '',
            custodyNo: fundData[0].custody_no || 'CUS-2026-001'
          });
        }
      }

      // 3. جلب الأرشيف
      const histRes = await fetch(`${SUPABASE_URL}/rest/v1/custody_history?select=*&order=created_at.desc`, { headers: reqHeaders });
      if (histRes.ok) {
        const histData = await histRes.json();
        setCustodyHistory(histData.map(h => ({
          id: h.id,
          custodyNo: h.custody_no,
          recipient: h.recipient,
          totalAmount: parseFloat(h.total_amount) || 0,
          spentAmount: parseFloat(h.spent_amount) || 0,
          remainingAmount: parseFloat(h.remaining_amount) || 0,
          currency: h.currency,
          closedAt: h.closed_at
        })));
      }
    } catch (err) {
      setSyncStatus('❌ تعذر الاتصال بالسحابة');
    }
  };

  useEffect(() => {
    fetchCloudData();
    const interval = setInterval(fetchCloudData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalSpent = invoices.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const remainingBalance = (parseFloat(custodyFund.amount) || 0) - totalSpent;

  // رفع مرفق الفاتورة
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, attachmentName: file.name, attachmentData: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // تسجيل فاتورة جديدة
  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    if (!formData.invoiceNumber || !formData.amount) return alert("يرجى إدخال رقم الفاتورة والمبلغ!");

    const newId = Date.now().toString();
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
      const res = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("✅ تم قيد الفاتورة وتزامنها مع السحابة فوراً!");
        setFormData({
          id: '', invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0],
          vendor: '', description: '', amount: '', category: 'CWIP - أصول قيد التنفيذ',
          attachmentName: '', attachmentData: ''
        });
        fetchCloudData();
      } else {
        alert("⚠️ فشل التزامن: تحقق من تنفيذ كود SQL في Supabase");
      }
    } catch (err) {
      alert("خطأ في الاتصال: " + err.message);
    }
  };

  // أرشفة العهدة الحالية
  const handleCloseAndArchive = async () => {
    if (confirm(`هل أنت متأكد من إغلاق العهدة (${custodyFund.custodyNo}) وأرشفتها؟`)) {
      const archivePayload = {
        id: Date.now().toString(),
        custody_no: custodyFund.custodyNo,
        recipient: custodyFund.recipient,
        total_amount: custodyFund.amount,
        spent_amount: totalSpent,
        remaining_amount: remainingBalance,
        currency: custodyFund.currency,
        closed_at: new Date().toLocaleDateString('ar-LY')
      };

      try {
        await fetch(`${SUPABASE_URL}/rest/v1/custody_history`, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify(archivePayload)
        });

        // مسح الفواتير الحالية للبدء بعهدة جديدة
        await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=gt.0`, { method: 'DELETE', headers: reqHeaders });
        
        fetchCloudData();
        alert("✅ تم أرشفة العهدة بنجاح وبدء عهدة جديدة!");
      } catch (err) {
        alert("تعذر الأرشفة: " + err.message);
      }
    }
  };

  // 🟢 إصلاح أزرار الواتساب لتضمين wa.me والتوافق التام
  const sendWhatsAppNotification = (type, data = {}) => {
    let text = '';
    const cleanPhone = custodyFund.phone ? custodyFund.phone.replace(/[^0-9]/g, '') : '';

    if (type === 'NEW_CUSTODY') {
      text = `📢 *إشعار استلام عهدة جديدة*\n\n👤 الأخ: ${custodyFund.recipient}\n🔢 رقم العهدة: ${custodyFund.custodyNo}\n💰 القيمة: ${custodyFund.amount} ${custodyFund.currency}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-LY')}`;
    } else if (type === 'FULL_REPORT') {
      text = `📋 *تقرير تسوية العهدة (${custodyFund.custodyNo})*\n\n👤 المسؤول: ${custodyFund.recipient}\n💰 إجمالي العهدة: ${custodyFund.amount} ${custodyFund.currency}\n🧾 المصروفات: ${totalSpent} ${custodyFund.currency}\n💵 الصافي المتبقي: ${remainingBalance} ${custodyFund.currency}`;
    } else if (type === 'SINGLE_INVOICE') {
      text = `🧾 *إشعار فاتورة رقم ${data.invoiceNumber}*\n\n🏢 المورد: ${data.vendor || 'مباشر'}\n💵 القيمة: ${data.amount} ${custodyFund.currency}\n📊 الصافي المتبقي بالعهدة: ${remainingBalance} ${custodyFund.currency}`;
    }

    const waLink = cleanPhone 
      ? `[suspicious link removed]{cleanPhone}?text=${encodeURIComponent(text)}`
      : `[suspicious link removed]{encodeURIComponent(text)}`;

    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ padding: '15px', fontFamily: 'system-ui, sans-serif', direction: 'rtl', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* الرأس */}
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '18px', borderRadius: '12px', marginBottom: '15px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🏢 منظومة العهدة المالية والمصروفات المباشرة</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{syncStatus}</p>
      </header>

      {/* التبويبات */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('custody')} style={{ flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'custody' ? '#2563eb' : '#e2e8f0', color: activeTab === 'custody' ? 'white' : '#1e293b' }}>🏛️ لوحة التحكم والإدارة (الكمبيوتر)</button>
        <button onClick={() => setActiveTab('delegate')} style={{ flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'delegate' ? '#16a34a' : '#e2e8f0', color: activeTab === 'delegate' ? 'white' : '#1e293b' }}>📱 واجهة المندوب / تسجيل فواتير الجوال</button>
      </div>

      {activeTab === 'custody' ? (
        <div>
          {/* معلومات العهدة مع الأزرار وإعادة زر الأرشفة */}
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>📋 العهدة الحالية: {custodyFund.custodyNo}</h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>المسؤول: <strong>{custodyFund.recipient}</strong> {custodyFund.phone && `(${custodyFund.phone})`}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => sendWhatsAppNotification('FULL_REPORT')} style={{ padding: '8px 12px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center' }}>
                  <WhatsAppIcon /> تقرير الواتساب
                </button>
                <button onClick={() => sendWhatsAppNotification('NEW_CUSTODY')} style={{ padding: '8px 12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center' }}>
                  <WhatsAppIcon /> إشعار عهدة
                </button>
                <button onClick={() => setShowFundModal(!showFundModal)} style={{ padding: '8px 12px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>⚙️ تخصيص</button>
                <button onClick={handleCloseAndArchive} style={{ padding: '8px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔒 أرشفة</button>
              </div>
            </div>

            {showFundModal && (
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginTop: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  <input type="text" placeholder="اسم المسؤول" value={custodyFund.recipient} onChange={e => setCustodyFund({...custodyFund, recipient: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <input type="text" placeholder="رقم الهاتف (218...)" value={custodyFund.phone} onChange={e => setCustodyFund({...custodyFund, phone: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <input type="number" placeholder="مبلغ العهدة" value={custodyFund.amount} onChange={e => setCustodyFund({...custodyFund, amount: parseFloat(e.target.value) || 0})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <button onClick={() => setShowFundModal(false)} style={{ padding: '6px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>حفظ التعديلات</button>
                </div>
              </div>
            )}
          </div>

          {/* ملخص الأرقام */}
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
                  <th style={{ padding: '8px' }}>التاريخ</th>
                  <th style={{ padding: '8px' }}>المورد</th>
                  <th style={{ padding: '8px' }}>المبلغ</th>
                  <th style={{ padding: '8px' }}>المرفق</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>مشاركة واتساب</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#94a3b8' }}>لا توجد فواتير مسجلة حالياً</td></tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: '8px' }}>{inv.invoiceDate}</td>
                      <td style={{ padding: '8px' }}>{inv.vendor || '-'}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#dc2626' }}>{inv.amount?.toLocaleString()} {custodyFund.currency}</td>
                      <td style={{ padding: '8px' }}>{inv.attachmentData ? <a href={inv.attachmentData} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>📎 عرض الصورة</a> : 'لا يوجد'}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button onClick={() => sendWhatsAppNotification('SINGLE_INVOICE', inv)} style={{ padding: '4px 8px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center' }}>
                          <WhatsAppIcon size={14} /> مشاركة
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* قسم الأرشيف المحدث */}
          {custodyHistory.length > 0 && (
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>📦 أرشيف العهد المغلقة ({custodyHistory.length})</h4>
              {custodyHistory.map(rec => (
                <div key={rec.id} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span><strong>{rec.custodyNo}</strong> ({rec.recipient}) - المصروف: {rec.spentAmount} {rec.currency} - الصافي: {rec.remainingAmount} {rec.currency}</span>
                  <span style={{ color: '#64748b' }}>📅 {rec.closedAt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* واجهة المندوب للجوال */
        <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#16a34a' }}>📱 واجهة تسجيل الفواتير من الجوال (تزامن سحابي)</h3>
          <form onSubmit={handleSubmitInvoice} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>رقم الفاتورة / الإيصال</label>
              <input type="text" placeholder="مثال: INV-1002" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>تاريخ الفاتورة</label>
              <input type="date" value={formData.invoiceDate} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>اسم المورد / المحل</label>
              <input type="text" placeholder="مثال: شركة المواد الجاهزة" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>المبلغ الإجمالي ({custodyFund.currency})</label>
              <input type="number" step="0.01" placeholder="مثال: 450" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }} required />
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
