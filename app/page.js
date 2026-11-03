'use client';

import React, { useState, useEffect } from 'react';

// رابط السحابة الصحيح المستخرج من لوحة التحكم
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

  // جلب البيانات المباشر من السحابة
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
          const first = fundData[0];
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
      const file = e.target.files[0];
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

        await
