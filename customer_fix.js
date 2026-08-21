const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/customer/page.tsx', 'utf8');

if (!c.includes('import { supabase }')) {
    c = c.replace('import { SkeletonCard } from @/components/Loading;', 'import { SkeletonCard } from @/components/Loading;\nimport { supabase } from @/lib/supabase;');
}

c = c.replace(/const sendOrderToCashier = \(\) => \{([\s\S]*?)setOrderStatus\('waiting_payment'\);\s*\};/, const sendOrderToCashier = async () => {
        if (cart.length === 0) return;
        
        // Generate Queue Number (1-999 daily) locally for now
        const today = new Date().toISOString().split('T')[0];
        const counterData = JSON.parse(localStorage.getItem(nexpos_queue_counter) || {});
        
        let nextNumber = 1;
        if (counterData.date === today) {
            nextNumber = (counterData.count || 0) + 1;
        }
        
        localStorage.setItem(nexpos_queue_counter, JSON.stringify({
            date: today,
            count: nextNumber
        }));
        
        const generatedQueueNumber = nextNumber.toString().padStart(3, '0');
        
        const newOrder = {
            queue_number: generatedQueueNumber,
            customer_name: customerName,
            items: cart,
            total: grandTotal,
            status: 'pending'
        };

        try {
            await supabase.from('kiosk_orders').insert([newOrder]);
            setQueueNumber(generatedQueueNumber);
            setOrderStatus('waiting_payment');
        } catch (error) {
            console.error(Gagal mengirim pesanan:, error);
            alert(Gagal mengirim pesanan. Silahkan coba lagi.);
        }
    };);

c = c.replace(/const checkPayment = \(\) => \{([\s\S]*?)\};\s*const interval = setInterval\(checkPayment, 1500\);/m, const checkPayment = async () => {
            try {
                const { data, error } = await supabase.from('kiosk_orders').select('status').eq('queue_number', queueNumber).maybeSingle();
                
                if (data) {
                    if (data.status === 'paid') {
                        setOrderStatus('paid');
                        setTimeout(() => {
                            setOrderStatus('idle');
                            setQueueNumber(null);
                            setCart([]);
                            setCustomerName(");
 }, 5000);
 } else if (data.status === 'draft') {
 setOrderStatus('draft');
 setTimeout(() => {
 setOrderStatus('idle');
 setQueueNumber(null);
 setCart([]);
 setCustomerName();
 }, 5000);
 }
 }
 } catch (err) {
 console.error(err);
 }
 };

 const interval = setInterval(checkPayment, 3000); // Poll every 3s);

fs.writeFileSync('frontend/src/app/customer/page.tsx', c);
