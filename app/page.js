'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('custody'); // custody | delegate | payroll

  // بيانات العهدة المفتوحة
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
  const [isLoaded, setIsLoaded] = useState(false);

  // نموذج الفاتورة
  const [formData, setFormData] = useState({
    id: '', invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0],
    vendor: '', description: '', amount: '', category: 'CWIP - أصول قيد التنفيذ',
    attachmentName: '', attachmentData: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  // حفظ واسترجاع البيانات محلياً
  useEffect(() => {
    const savedFund = localStorage.getItem('cement_fund');
    if (savedFund) setCustodyFund(JSON.parse(savedFund));
    const savedInvoices = localStorage.getItem('cement_invoices');
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    const savedHistory = localStorage.getItem('cement_history');
    if (savedHistory) setCustodyHistory(JSON.parse(savedHistory));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cement_fund', JSON.stringify(custodyFund));
      localStorage.setItem('cement_invoices', JSON.stringify(invoices));
      localStorage.setItem('cement_history', JSON.stringify(custodyHistory));
    }
  }, [custodyFund, invoices, custodyHistory, isLoaded]);

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

  // إضافة أو تعديل فاتورة
  const handleSubmitInvoice = (e) => {
    e.preventDefault();
    if (!formData.invoiceNumber || !formData.amount) return alert("يرجى إدخال رقم الفاتورة والمبلغ!");

    if (isEditing) {
      setInvoices(prev => prev.map(i => i.id === formData.id ? { ...formData, amount: parseFloat(formData.amount) } : i));
      setIsEditing(false);
    } else {
      setInvoices(prev => [{ ...formData, id: Date.now().toString(), amount: parseFloat(formData.amount) }, ...prev]);
    }

    setFormData({
      id: '', invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0],
      vendor: '', description: '', amount: '', category: 'CWIP - أصول قيد التنفيذ',
      attachmentName: '', attachmentData: ''
    });
    alert("✅ تم تسجيل الفاتورة بنجاح!");
  };

  // أرشفة العهدة
  const handleCloseAndArchive = () => {
    if (confirm(`هل أنت متأكد من إغلاق العهدة (${custodyFund.custodyNo}) وأرشفتها؟`)) {
      const record = {
        id: Date.now().toString(), custodyNo: custodyFund.custodyNo, recipient: custodyFund.recipient,
        totalAmount: custodyFund.amount, spentAmount: totalSpent, remainingAmount: remainingBalance,
        currency: custodyFund.currency, closedAt: new Date().toLocaleDateString('ar-LY'), invoicesList: [...invoices]
      };
      const newHistory = [record, ...custodyHistory];
      setCustodyHistory(newHistory);
      setCustodyFund({ amount: 0, currency: 'LYD', recipient: '', phone: '', custodyNo: `CUS-2026-0${newHistory.length + 1}` });
      setInvoices([]);
      alert("✅ تم إغلاق العهدة وأرشفتها بنجاح!");
    }
  };

  // إعادة فتح عهدة مؤرشفة
  const handleReopenCustody = (rec) => {
    setCustodyHistory(prev => prev.filter(r => r.id !== rec.id));
    setCustodyFund({ amount: rec.totalAmount, currency: rec.currency, recipient: rec.recipient, phone: rec.phone || '', custodyNo: rec.custodyNo });
    setInvoices(rec.invoicesList || []);
    alert(`🔓 تم فتح العهدة (${rec.custodyNo}) بنجاح للتعديل!`);
  };

  // 📱 إشعارات الواتساب التلقائية بنقرة زر
  const sendWhatsAppNotification = (type, data = {}) => {
    let text = '';
    const cleanPhone = custodyFund.phone ? custodyFund.phone.replace(/[^0-9]/g, '') : '';
    
    if (type === 'NEW_CUSTODY') {
      text = `📢 *إشعار تنزيل عهدة جديدة*\n\n👤 الأخ: ${custodyFund.recipient}\n🔢 رقم العهدة: ${custodyFund.custodyNo}\n💰 قيمة العهدة: ${custodyFund.amount} ${custodyFund.currency}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-LY')}\n\nيرجى تسليم الفواتير أولاً بأول عبر المنظومة.`;
    } else if (type === 'INVOICE_ADDED') {
      text = `🧾 *إشعار قيد فاتورة جديد*\n\n👤 المسؤول: ${custodyFund.recipient}\n🔢 رقم الفاتورة: ${data.invoiceNumber}\n🏢 المورد: ${data.vendor || 'مباشر'}\n💵 القيمة: ${data.amount} ${custodyFund.currency}\n📊 الصافي المتبقي من العهدة: ${remainingBalance - parseFloat(data.amount)} ${custodyFund.currency}`;
    } else if (type === 'FULL_REPORT') {
      text = `📋 *كشف تسوية العهدة المالية (${custodyFund.custodyNo})*\n\n👤 المسؤول: ${custodyFund.recipient}\n💰 قيمة العهدة الأصلية: ${custodyFund.amount} ${custodyFund.currency}\n🧾 إجمالي المصروفات: ${totalSpent} ${custodyFund.currency}\n💵 المتبقي نقدياً: ${remainingBalance} ${custodyFund.currency}\n🔢 عدد الفواتير المسجلة: ${invoices.length}`;
    }

    const url = cleanPhone ? `[suspicious link removed]{cleanPhone}?text=${encodeURIComponent(text)}` : `[suspicious link removed]{encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: '15px', fontFamily: 'system-ui, sans-serif', direction: 'rtl', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* رأس الصفحة */}
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '18px', borderRadius: '12px', marginBottom: '15px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🏢 منظومة العهدة المالية والمصروفات المباشرة</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>مشروع مصنع الأسمنت - التتبع الحسابي وإشعارات الواتساب</p>
      </header>

      {/* التبويبات الرئيسية */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('custody')} style={{ flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'custody' ? '#2563eb' : '#e2e8f0', color: activeTab === 'custody' ? 'white' : '#1e293b' }}>🏛️ لوحة العهدة والإدارة</button>
        <button onClick={() => setActiveTab('delegate')} style={{ flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'delegate' ? '#16a34a' : '#e2e8f0', color: activeTab === 'delegate' ? 'white' : '#1e293b' }}>📱 واجهة المندوب / الموقع</button>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'custody' ? (
        <div>
          {/* شريط معلومات العهدة */}
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>📋 العهدة الحالية: {custodyFund.custodyNo}</h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>المسؤول: <strong>{custodyFund.recipient || 'غير محدد'}</strong> {custodyFund.phone && `(${custodyFund.phone})`}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => sendWhatsAppNotification('FULL_REPORT')} style={{ padding: '8px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>📱 إرسال تقرير بالواتساب</button>
                <button onClick={() => sendWhatsAppNotification('NEW_CUSTODY')} style={{ padding: '8px 12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>📲 إشعار استلام عهدة</button>
                <button onClick={() => setShowFundModal(!showFundModal)} style={{ padding: '8px 12px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>⚙️ تخصيص</button>
                <button onClick={handleCloseAndArchive} style={{ padding: '8px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔒 أرشفة</button>
              </div>
            </div>

            {/* نافذة تخصيص العهدة */}
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
              <span style={{ fontSize: '12px', color: '#64748b' }}>المصروفات المسجلة</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{totalSpent.toLocaleString()} {custodyFund.currency}</div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', borderRight: '4px solid #10b981' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>الرصيد المتبقي</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: remainingBalance >= 0 ? '#10b981' : '#dc2626' }}>{remainingBalance.toLocaleString()} {custodyFund.currency}</div>
            </div>
          </div>

          {/* جدول الفواتير */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr>
                  <th style={{ padding: '8px' }}>الفاتورة</th>
                  <th style={{ padding: '8px' }}>التاريخ</th>
                  <th style={{ padding: '8px' }}>المورد</th>
                  <th style={{ padding: '8px' }}>المبلغ</th>
                  <th style={{ padding: '8px' }}>المرفق</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>إجراءات</th>
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
                        <button onClick={() => { setFormData(inv); setIsEditing(true); setActiveTab('delegate'); }} style={{ padding: '3px 6px', marginLeft: '4px' }}>✏️</button>
                        <button onClick={() => setInvoices(prev => prev.filter(i => i.id !== inv.id))} style={{ padding: '3px 6px', color: 'red' }}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* الأرشيف */}
          {custodyHistory.length > 0 && (
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>📦 أرشيف العهد المغلقة ({custodyHistory.length})</h4>
              {custodyHistory.map(rec => (
                <div key={rec.id} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span><strong>{rec.custodyNo}</strong> ({rec.recipient}) - المصروف: {rec.spentAmount} {rec.currency}</span>
                  <button onClick={() => handleReopenCustody(rec)} style={{ padding: '4px 8px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🔓 إعادة فتح العهدة</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* واجهة المندوب / تنزيل الفواتير من الجوال */
        <div style={{ backgroundColor: 'white', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#16a34a' }}>📱 واجهة تسجيل الفواتير والمرفقات من الجوال</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>يمكن للمندوب في الموقع رفع صور الفواتير وتوثيق المشتريات مباشرة لتحديث الصافي المتبقي.</p>

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
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>تصنيف النفقة</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}>
                <option value="CWIP - أصول قيد التنفيذ">CWIP - أصول قيد التنفيذ (معدات ومباني)</option>
                <option value="مواد تشغيلية وتجهيزات">مواد تشغيلية وتجهيزات</option>
                <option value="نقل ولوجستيات">نقل ولوجستيات</option>
                <option value="سُلف ومصروفات عمالة">سُلف ومصروفات عمالة</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>📷 تصوير / رفع الفاتورة</label>
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ width: '100%', padding: '6px', fontSize: '11px', marginTop: '4px' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                {isEditing ? '✏️ حفظ التعديلات' : '💾 تسجيل الفاتورة وتحديث الصافي'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
