const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/pos/page.tsx', 'utf8');

// 1. Add payment_method_name to setPaymentResult
c = c.replace(/setPaymentResult\(\{\s*\.\.\.result,\s*transaction: \{/, setPaymentResult({
                ...result,
                payment_method_name: selectedMethod.name === 'Tunai' ? 'Kartu' : selectedMethod.name,
                transaction: {);

// 2. Change the button display for Tunai to Kartu
c = c.replace(/\{m\.name\}/g, {m.name === 'Tunai' ? 'Kartu' : m.name});

// 3. Change TUNAI in receipt to use payment method name
c = c.replace(/<span>TUNAI<\/span>/, <span>{(paymentResult.payment_method_name || 'TUNAI').toUpperCase()}</span>);

// 4. Also hide KEMBALI if it's Kartu or QRIS (if change is 0 and it's non-cash? Well change is already checking > 0)
// Actually change is already checked: {(paymentResult.change_given || 0) > 0 && (...)}? NO, it wasn't. Let's fix it.
c = c.replace(/<div className= flex justify-between text-sm>\s*<span>KEMBALI<\/span>\s*<span>Rp \{\(paymentResult\.change_given \|\| 0\)\.toLocaleString\('id-ID'\)\}<\/span>\s*<\/div>/, {(paymentResult.change_given || 0) > 0 && (<div className=flex justify-between text-sm><span>KEMBALI</span><span>Rp {(paymentResult.change_given || 0).toLocaleString('id-ID')}</span></div>)});

fs.writeFileSync('frontend/src/app/pos/page.tsx', c);
