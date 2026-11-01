'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('custody');

  // بيانات العهدة المفتوحة
  const [custodyFund, setCustodyFund] = useState({
    amount: 50000,
    currency: 'LYD',
    recipient: 'أحمد الصالحي',
    custodyNo: 'CUS-2026-001'
  });

  const [invoices, setInvoices] = useState([]);
  const [custodyHistory, setCustodyHistory] = useState([]);
  const [showFundModal, setShowFundModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // نموذج الفاتورة والمرفقات
  const [formData, setFormData] = useState({
    id: '', invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0],
    vendor: '', description: '', amount: '', category: 'مواد بناء وتجهيزات',
    attachmentName: '', attachmentData: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  // بيانات المرتبات
  const [payrollData, setPayrollData] = useState({ employees: [] });
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', type: 'CWIP - أصول قيد التنفيذ', baseSalary: '', allowance: '' });

  // حفظ واسترجاع محلي للحساب الرئيسي
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

  // رفع مستند الفاتورة
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

  // حفظ/تعديل الفاتورة
  const handleSubmitInvoice = (e) => {
    e.preventDefault();
    if (!formData.invoiceNumber || !formData.amount) return alert("يرجى إدخال رقم الفاتورة والمبلغ!");

    if (isEditing) {
      setInvoices(prev => prev.map(i => i.id === formData.id ? { ...formData, amount: parseFloat(formData.amount) } : i));
      setIsEditing(false);
    } else {
      setInvoices(prev => [{ ...formData, id: Date.now().toString(), amount: parseFloat(formData.amount) }, ...prev]);
    }

    setFormData({ id: '', invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0], vendor: '', description: '', amount: '', category: 'مواد بناء وتجهيزات', attachmentName: '', attachmentData: '' });
  };

  // إغلاق وأرشفة العهدة
  const handleCloseAndArchive = () => {
    if (confirm(`هل أنت متأكد من إغلاق العهدة (${custodyFund.custodyNo}) وأرشفتها؟`)) {
      const record = { id: Date.now().toString(), custodyNo: custodyFund.custodyNo, recipient: custodyFund.recipient, totalAmount: custodyFund.amount, spentAmount: totalSpent, remainingAmount: remainingBalance, currency: custodyFund.currency, closedAt: new Date().toLocaleDateString('ar-LY'), invoicesList: [...invoices] };
      const newHistory = [record, ...custodyHistory];
      setCustodyHistory(newHistory);
      setCustodyFund({ amount: 0, currency: 'LYD', recipient: '', custodyNo: `CUS-2026-0${newHistory.length + 1}` });
      setInvoices([]);
      alert("✅ تم إغلاق العهدة وأرشفتها بنجاح!");
    }
  };

  // إعادة فتح عهدة مؤرشفة
  const handleReopenCustody = (rec) => {
    setCustodyHistory(prev => prev.filter(r => r.id !== rec.id));
    setCustodyFund({ amount: rec.totalAmount, currency: rec.currency, recipient: rec.recipient, custodyNo: rec.custodyNo });
    setInvoices(rec.invoicesList || []);
    alert(`🔓 تم فتح العهدة (${rec.custodyNo}) بنجاح للتعديل!`);
  };

  // إرسال كشف حساب للواتساب
  const sendWhatsAppReport = () => {
    const text = `📋 *تقرير تسوية العهدة المالية (${custodyFund.custodyNo})*\n👤 المسؤول: ${custodyFund.recipient}\n💰 إجمالي العهدة: ${custodyFund.amount} ${custodyFund.currency}\n🧾 المصروفات: ${totalSpent} ${custodyFund.currency}\n💵 المتبقي: ${remainingBalance} ${custodyFund.currency}\nعدد الفواتير: ${invoices.length}`;
    window.open(`[suspicious link removed]{encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', direction: 'rtl' }}>
      <header style={{ backgroundColor: '#1e293b', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>🏢 منظومة إدارة العهدة المالية والمرتبات - مصنع الأسمنت</h1>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('custody')} style={{ flex: 1, padding: '12px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'custody' ? '#2563eb' : '#cbd5e1', color: activeTab === 'custody' ? 'white' : '#0f172a' }}>💰 إدارة العهدة والتسوية</button>
        <button onClick={() => setActiveTab('payroll')} style={{ flex: 1, padding: '12px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'payroll' ? '#2563eb' : '#cbd5e1', color: activeTab === 'payroll' ? 'white' : '#0f172a' }}>👥 منظومة المرتبات</button>
      </div>

      {activeTab === 'custody' ? (
        <div>
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', border: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ margin: 0 }}>📋 العهدة الحالية ({custodyFund.custodyNo})</h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>المسؤول: {custodyFund.recipient || 'غير محدد'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={sendWhatsAppReport} style={{ padding: '8px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>📱 مشاركة عبر الواتساب</button>
              <button onClick={() => setShowFundModal(!showFundModal)} style={{ padding: '8px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>⚙️ تخصيص عهدة</button>
              <button onClick={handleCloseAndArchive} style={{ padding: '8px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>🔒 إغلاق وأرشفة</button>
            </div>
          </div>

          {showFundModal && (
            <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                <input type="text" placeholder="اسم المسؤول" value={custodyFund.recipient} onChange={e => setCustodyFund({...custodyFund, recipient: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="number" placeholder="مبلغ العهدة" value={custodyFund.amount} onChange={e => setCustodyFund({...custodyFund, amount: parseFloat(e.target.value) || 0})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <button onClick={() => setShowFundModal(false)} style={{ padding: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px' }}>حفظ</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', borderRight: '4px solid #2563eb' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>مبلغ العهدة</span>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{(custodyFund.amount || 0).toLocaleString()} {custodyFund.currency}</div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', borderRight: '4px solid #ef4444' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>إجمالي الفواتير</span>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{totalSpent.toLocaleString()} {custodyFund.currency}</div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', borderRight: '4px solid #10b981' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>الصافي المتبقي</span>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: remainingBalance >= 0 ? '#10b981' : '#dc2626' }}>{remainingBalance.toLocaleString()} {custodyFund.currency}</div>
            </div>
          </div>

          <form onSubmit={handleSubmitInvoice} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>{isEditing ? '✏️ تعديل فاتورة' : '➕ إضافة فاتورة جديدة والمرفقات'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <input type="text" placeholder="رقم الفاتورة" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
              <input type="date" value={formData.invoiceDate} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
              <input type="text" placeholder="المورد" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="number" step="0.01" placeholder="المبلغ" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ padding: '4px', fontSize: '11px' }} />
              <button type="submit" style={{ padding: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>حفظ الفاتورة</button>
            </div>
          </form>

          <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr>
                  <th style={{ padding: '10px' }}>رقم الفاتورة</th>
                  <th style={{ padding: '10px' }}>التاريخ</th>
                  <th style={{ padding: '10px' }}>المورد</th>
                  <th style={{ padding: '10px' }}>المبلغ</th>
                  <th style={{ padding: '10px' }}>المرفق</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '10px' }}>{inv.invoiceDate}</td>
                    <td style={{ padding: '10px' }}>{inv.vendor || '-'}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#ef4444' }}>{inv.amount?.toLocaleString()} {custodyFund.currency}</td>
                    <td style={{ padding: '10px' }}>{inv.attachmentData ? <a href={inv.attachmentData} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>📎 معاينة</a> : '-'}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button onClick={() => { setFormData(inv); setIsEditing(true); }} style={{ padding: '3px 6px', marginLeft: '4px' }}>✏️</button>
                      <button onClick={() => setInvoices(prev => prev.filter(i => i.id !== inv.id))} style={{ padding: '3px 6px', color: 'red' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {custodyHistory.length > 0 && (
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>📦 أرشيف العهد المغلقة ({custodyHistory.length})</h4>
              {custodyHistory.map(rec => (
                <div key={rec.id} style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span><strong>{rec.custodyNo}</strong> ({rec.recipient}) - المصروف: {rec.spentAmount} {rec.currency}</span>
                  <button onClick={() => handleReopenCustody(rec)} style={{ padding: '5px 10px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🔓 إعادة فتح العهدة</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
          <h3>👥 قسم المرتبات قيد التطوير والسُلف المباشرة</h3>
        </div>
      )}
    </div>
  );
}
