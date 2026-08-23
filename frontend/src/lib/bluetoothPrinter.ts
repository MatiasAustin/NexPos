export class BluetoothPrinter {
    device: any = null;
    server: any = null;
    service: any = null;
    characteristic: any = null;

    async connect() {
        if (!(navigator as any).bluetooth) {
            throw new Error("Browser ini tidak mendukung Web Bluetooth (Coba gunakan Google Chrome).");
        }

        try {
            // Request any bluetooth device that has generic services, or just accept all
            this.device = await (navigator as any).bluetooth.requestDevice({
                filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
                optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2']
            }).catch(() => {
                // Fallback to accepting all devices if specific service fails
                return (navigator as any).bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '0000fee7-0000-1000-8000-00805f9b34fb']
                });
            });

            this.server = await this.device.gatt.connect();

            // Try common thermal printer services
            const serviceUuids = ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '0000fee7-0000-1000-8000-00805f9b34fb'];
            
            for (const uuid of serviceUuids) {
                try {
                    this.service = await this.server.getPrimaryService(uuid);
                    break;
                } catch (e) {}
            }

            if (!this.service) {
                // If specific failed, grab first available service
                const services = await this.server.getPrimaryServices();
                if (services.length > 0) {
                    this.service = services[0];
                } else {
                    throw new Error("Tidak menemukan service pada printer ini.");
                }
            }

            const characteristics = await this.service.getCharacteristics();
            // Find a writable characteristic
            this.characteristic = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);

            if (!this.characteristic) {
                throw new Error("Tidak dapat menulis ke printer ini.");
            }

            return true;
        } catch (error) {
            console.error("Bluetooth Connect Error:", error);
            throw error;
        }
    }

    async printReceipt(storeName: string, receiptData: any) {
        if (!this.characteristic) {
            throw new Error("Printer belum terhubung.");
        }

        const encoder = new TextEncoder();
        
        // ESC/POS Commands
        const ESC = "\x1B";
        const GS = "\x1D";
        const INIT = ESC + "@";
        const ALIGN_CENTER = ESC + "a\x01";
        const ALIGN_LEFT = ESC + "a\x00";
        const ALIGN_RIGHT = ESC + "a\x02";
        const BOLD_ON = ESC + "E\x01";
        const BOLD_OFF = ESC + "E\x00";
        const FEED = "\x0A";
        const CUT = GS + "V\x00"; // Full cut

        let printData = INIT;
        printData += ALIGN_CENTER + BOLD_ON + storeName + FEED + BOLD_OFF;
        printData += "--------------------------------" + FEED; // 32 chars for 58mm
        
        printData += ALIGN_LEFT;
        printData += `Order: ${receiptData.transaction?.order_reference || receiptData.order_reference}` + FEED;
        if (receiptData.transaction?.customer_name) {
            printData += `Nama: ${receiptData.transaction.customer_name}` + FEED;
        }
        printData += "--------------------------------" + FEED;

        const items = receiptData.transaction?.items || receiptData.items || [];
        for (const item of items) {
            const name = item.product_name.substring(0, 32);
            printData += name + FEED;
            
            const qtyPrice = `${item.quantity} x Rp${item.price.toLocaleString('id-ID')}`;
            const total = `Rp${(item.quantity * item.price).toLocaleString('id-ID')}`;
            
            // Format to 32 chars: left side + right side
            let spaces = 32 - (qtyPrice.length + total.length);
            if (spaces < 1) spaces = 1;
            printData += qtyPrice + " ".repeat(spaces) + total + FEED;
        }

        printData += "--------------------------------" + FEED;
        
        const totalAmount = `Rp${(receiptData.transaction?.amount_due || receiptData.amount_due || 0).toLocaleString('id-ID')}`;
        let spacesTotal = 32 - (5 + totalAmount.length);
        if(spacesTotal < 1) spacesTotal = 1;
        printData += BOLD_ON + "TOTAL" + " ".repeat(spacesTotal) + totalAmount + BOLD_OFF + FEED;

        const method = (receiptData.payment_method_name || 'TUNAI').toUpperCase();
        const rcv = `Rp${(receiptData.transaction?.amount_received || receiptData.amount_received || 0).toLocaleString('id-ID')}`;
        let spacesRcv = 32 - (method.length + rcv.length);
        if(spacesRcv < 1) spacesRcv = 1;
        printData += method + " ".repeat(spacesRcv) + rcv + FEED;

        const change = receiptData.change_given || 0;
        if (change > 0) {
            const changeStr = `Rp${change.toLocaleString('id-ID')}`;
            let spacesChg = 32 - (7 + changeStr.length);
            if(spacesChg < 1) spacesChg = 1;
            printData += "KEMBALI" + " ".repeat(spacesChg) + changeStr + FEED;
        }

        printData += FEED + ALIGN_CENTER + "Terima Kasih Atas" + FEED + "Kunjungan Anda!" + FEED + FEED + FEED + FEED;
        
        // Try to cut
        printData += CUT;

        // Convert string to Uint8Array
        let buffer = encoder.encode(printData);

        // Send in chunks (max 512 bytes per write is safe for BLE)
        const chunkSize = 256;
        for (let i = 0; i < buffer.length; i += chunkSize) {
            const chunk = buffer.slice(i, i + chunkSize);
            await this.characteristic.writeValue(chunk);
        }
    }
}
