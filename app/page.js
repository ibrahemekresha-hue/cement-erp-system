function sendWhatsAppNotification(type, data) {
    const itemData = data || {};
    let text = '';
    
    // إشعار العهدة الجديدة يذهب لمسؤول العهدة، والتقرير المالي والفواتير تذهب لصاحب المنظومة
    let targetPhone = custodyFund.ownerPhone;
    if (type === 'NEW_CUSTODY') {
      targetPhone = custodyFund.recipientPhone || custodyFund.ownerPhone;
    }
    
    const formattedPhone = cleanPhoneNumber(targetPhone);

    if (type === 'NEW_CUSTODY') {
      text = '📢 *إشعار استلام عهدة جديدة*\n\n👤 مسؤول العهدة: ' + custodyFund.recipient + '\n🔢 رقم العهدة: ' + custodyFund.custodyNo + '\n💰 القيمة: ' + (custodyFund.amount || 0).toLocaleString() + ' ' + custodyFund.currency + '\n📅 التاريخ: ' + new Date().toLocaleDateString('ar-LY');
    } else if (type === 'FULL_REPORT') {
      text = '📋 *تقرير تسوية العهدة (' + custodyFund.custodyNo + ')*\n\n👤 مسؤول العهدة: ' + custodyFund.recipient + '\n💰 إجمالي العهدة: ' + (custodyFund.amount || 0).toLocaleString() + ' ' + custodyFund.currency + '\n🧾 المصروفات: ' + totalSpent.toLocaleString() + ' ' + custodyFund.currency + '\n💵 الصافي المتبقي: ' + remainingBalance.toLocaleString() + ' ' + custodyFund.currency;
    } else if (type === 'SINGLE_INVOICE') {
      text = '🧾 *إشعار فاتورة رقم ' + itemData.invoiceNumber + '*\n\n🏢 المورد: ' + (itemData.vendor || 'مباشر') + '\n💵 القيمة: ' + itemData.amount + ' ' + custodyFund.currency + '\n📊 الصافي المتبقي بالعهدة: ' + remainingBalance.toLocaleString() + ' ' + custodyFund.currency;
    }

    let waUrl = '';
    if (formattedPhone) {
      waUrl = 'https://wa.me/' + formattedPhone + '?text=' + encodeURIComponent(text);
    } else {
      waUrl = '[suspicious link removed]' + encodeURIComponent(text);
    }

    // فتح الرابط بشكل مباشر لتفادي حظر النوافذ المنبثقة
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
