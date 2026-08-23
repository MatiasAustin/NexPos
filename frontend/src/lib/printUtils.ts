export const generateReceiptText = (
    storeSettings: any,
    transaction: any,
    items: any[],
    staffName: string,
    paymentMethodName: string
) => {
    const alignCenter = (str: string) => {
        const len = str.length;
        if (len >= 32) return str.substring(0, 32);
        const spaces = Math.floor((32 - len) / 2);
        return " ".repeat(spaces) + str + " ".repeat(32 - len - spaces);
    };
    
    const alignLeftRight = (left: string, right: string) => {
        const spaceLen = 32 - left.length - right.length;
        if (spaceLen > 0) return left + " ".repeat(spaceLen) + right;
        return (left + " " + right).substring(0, 32);
    };

    let text = "";
    
    text += alignCenter(storeSettings?.store_name || 'NEXPOS') + "\n";
    if (storeSettings?.store_address) text += alignCenter(storeSettings.store_address) + "\n";
    if (storeSettings?.store_phone) text += alignCenter(storeSettings.store_phone) + "\n";
    text += "--------------------------------\n";
    
    const orderRef = transaction?.order_reference || 'N/A';
    const dateObj = transaction?.created_at ? new Date(transaction.created_at) : new Date();
    
    text += alignLeftRight(`No: ${orderRef}`, dateObj.toLocaleDateString('id-ID')) + "\n";
    text += alignLeftRight(`Kasir: ${staffName || 'Admin'}`, dateObj.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})) + "\n";
    
    if (transaction?.customer_name) {
        text += alignLeftRight("Pelanggan:", transaction.customer_name) + "\n";
    }
    
    text += "--------------------------------\n";

    for (const item of items) {
        text += item.product_name + "\n";
        const price = item.price_at_time || item.price || 0;
        const qtyPrice = `${item.quantity} x Rp${price.toLocaleString('id-ID')}`;
        const total = `Rp${(item.quantity * price).toLocaleString('id-ID')}`;
        text += alignLeftRight(qtyPrice, total) + "\n";
    }
    
    text += "--------------------------------\n";
    
    const tax = Number(transaction?.tax_amount || 0);
    const amountDue = Number(transaction?.amount_due || 0);
    const amountRcv = Number(transaction?.amount_received || 0);
    const change = Number(transaction?.change_given || 0);

    if (tax > 0) {
        text += alignLeftRight("Subtotal", `Rp${(amountDue - tax).toLocaleString('id-ID')}`) + "\n";
        text += alignLeftRight("Pajak", `Rp${tax.toLocaleString('id-ID')}`) + "\n";
    }
    
    text += alignLeftRight("TOTAL", `Rp${amountDue.toLocaleString('id-ID')}`) + "\n";
    text += alignLeftRight((paymentMethodName || 'TUNAI').toUpperCase(), `Rp${amountRcv.toLocaleString('id-ID')}`) + "\n";
    
    if (change > 0) {
        text += alignLeftRight("KEMBALI", `Rp${change.toLocaleString('id-ID')}`) + "\n";
    }
    
    text += "--------------------------------\n";
    text += "\n" + alignCenter(storeSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda!') + "\n";
    
    if (storeSettings?.wifi_password) {
        if (storeSettings?.wifi_name) text += alignCenter(`WiFi: ${storeSettings.wifi_name}`) + "\n";
        text += alignCenter(`Pass: ${storeSettings.wifi_password}`) + "\n";
    }
    
    text += "\n" + alignCenter("Powered by NexPos") + "\n\n\n";

    return text;
};

export const printWithRawBT = (text: string) => {
    window.location.href = `intent:${encodeURIComponent(text)}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
};
