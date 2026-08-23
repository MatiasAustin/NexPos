export const generateReceiptHtml = (
    storeSettings: any,
    transaction: any,
    items: any[],
    staffName: string,
    paymentMethodName: string
) => {
    const orderRef = transaction?.order_reference || 'N/A';
    const dateObj = transaction?.created_at ? new Date(transaction.created_at) : new Date();
    
    let html = `
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: monospace; font-size: 12px; color: black; background: white; margin: 0; padding: 0; width: 58mm; }
                .text-center { text-align: center; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .font-bold { font-weight: bold; }
                .border-b { border-bottom: 1px dashed black; }
                .border-t { border-top: 1px dashed black; }
                .mb-4 { margin-bottom: 16px; }
                .mt-4 { margin-top: 16px; }
                .w-full { width: 100%; }
                table { width: 100%; border-collapse: collapse; }
                td { vertical-align: bottom; }
                .text-right { text-align: right; }
            </style>
        </head>
        <body>
            <div class="w-full text-center border-b pb-4 mb-4">
    `;

    if (storeSettings?.logo_base64) {
        html += `<img src="${storeSettings.logo_base64}" alt="Logo" style="width: ${storeSettings.logo_size || '80px'}; height: ${storeSettings.logo_size || '80px'};" class="mb-2 object-contain grayscale" /><br/>`;
    }
    
    html += `
                <div class="font-bold" style="font-size:16px;">${storeSettings?.store_name || 'NEXPOS'}</div>
                <div>${storeSettings?.store_address || ''}</div>
                <div>${storeSettings?.store_phone || ''}</div>
            </div>
            
            <div class="w-full mb-4 border-b pb-4">
                <div class="flex justify-between">
                    <span>No: ${orderRef}</span>
                    <span>${dateObj.toLocaleDateString('id-ID')}</span>
                </div>
                <div class="flex justify-between">
                    <span>Kasir: ${staffName || 'Admin'}</span>
                    <span>${dateObj.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
    `;

    if (transaction?.customer_name) {
        html += `
                <div class="flex justify-between border-t mt-4" style="padding-top:4px;">
                    <span>Pelanggan:</span>
                    <span>${transaction.customer_name}</span>
                </div>
        `;
    }

    html += `
            </div>
            <div class="w-full">
                <table class="w-full text-left mb-4">
                    <tbody>
    `;

    for (const item of items) {
        const price = item.price_at_time || item.price || 0;
        html += `
                        <tr>
                            <td style="padding:2px 0;">${item.product_name}<br/><span style="font-size:10px;">${item.quantity} x Rp ${price.toLocaleString('id-ID')}</span></td>
                            <td class="text-right" style="padding:2px 0;">Rp ${(item.quantity * price).toLocaleString('id-ID')}</td>
                        </tr>
        `;
    }

    html += `
                    </tbody>
                </table>
            </div>
            
            <div class="w-full border-t pt-4 mb-4">
    `;

    const tax = Number(transaction?.tax_amount || 0);
    const amountDue = Number(transaction?.amount_due || 0);
    const amountRcv = Number(transaction?.amount_received || 0);
    const change = Number(transaction?.change_given || 0);

    if (tax > 0) {
        html += `
                <div class="flex justify-between" style="margin-bottom:2px;">
                    <span>Subtotal</span>
                    <span>Rp ${(amountDue - tax).toLocaleString('id-ID')}</span>
                </div>
                <div class="flex justify-between" style="margin-bottom:2px;">
                    <span>Pajak</span>
                    <span>Rp ${tax.toLocaleString('id-ID')}</span>
                </div>
        `;
    }

    html += `
                <div class="flex justify-between font-bold">
                    <span>TOTAL</span>
                    <span>Rp ${amountDue.toLocaleString('id-ID')}</span>
                </div>
                <div class="flex justify-between" style="margin-top:2px;">
                    <span>${(paymentMethodName || 'TUNAI').toUpperCase()}</span>
                    <span>Rp ${amountRcv.toLocaleString('id-ID')}</span>
                </div>
    `;

    if (change > 0) {
        html += `
                <div class="flex justify-between" style="margin-top:2px;">
                    <span>KEMBALI</span>
                    <span>Rp ${change.toLocaleString('id-ID')}</span>
                </div>
        `;
    }

    html += `
            </div>
            <div class="w-full text-center mt-4 pt-4">
    `;

    if (storeSettings?.qris_image_base64) {
        html += `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; margin:16px 0;">
                    <p class="font-bold" style="font-size:10px; margin-bottom:8px;">SCAN QRIS UNTUK BAYAR</p>
                    <img src="${storeSettings.qris_image_base64}" alt="QRIS" style="width:128px; height:128px; object-fit:contain;" />
                </div>
        `;
    }

    html += `
                <div class="font-bold mb-4" style="white-space:pre-wrap;">${storeSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda!'}</div>
    `;

    if (storeSettings?.wifi_password) {
        html += `
                <div class="mt-4">
                    ${storeSettings?.wifi_name ? `<div class="font-bold">WiFi: ${storeSettings.wifi_name}</div>` : ''}
                    <div>Pass: ${storeSettings.wifi_password}</div>
                </div>
        `;
    }

    html += `
                <div style="font-size:10px; margin-top:16px;">Powered by NexPos</div>
            </div>
        </body>
        </html>
    `;

    return html;
};

export const printWithRawBT = (htmlString: string) => {
    const base64Html = btoa(unescape(encodeURIComponent(htmlString)));
    window.location.href = `intent:base64,${base64Html}#Intent;scheme=rawbt;type=text/html;package=ru.a402d.rawbtprinter;end;`;
};
