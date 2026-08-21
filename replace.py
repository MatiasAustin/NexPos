import re
with open('frontend/src/app/pos/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add payment_method_name to setPaymentResult
c = re.sub(r'setPaymentResult\(\{\s*\.\.\.result,\s*transaction: \{', r'setPaymentResult({\n                ...result,\n                payment_method_name: selectedMethod.name === Tunai ? Kartu : selectedMethod.name,\n                transaction: {', c)

# 2. Change the button display for Tunai to Kartu
c = c.replace('{m.name}', '{m.name === " Tunai\ ? \Kartu\ : m.name}')

# 3. Change TUNAI in receipt to use payment method name
c = c.replace('<span>TUNAI</span>', '<span>{(paymentResult.payment_method_name || \TUNAI\).toUpperCase()}</span>')

# 4. Hide KEMBALI if it is 0
c = re.sub(r'<div className=flex justify-between text-sm>\s*<span>KEMBALI</span>\s*<span>Rp \{\(paymentResult\.change_given \|\| 0\)\.toLocaleString\(\'id-ID\'\)\}</span>\s*</div>', r'{(paymentResult.change_given || 0) > 0 && (<div className=flex justify-between text-sm><span>KEMBALI</span><span>Rp {(paymentResult.change_given || 0).toLocaleString(\'id-ID\')}</span></div>)}', c)

with open('frontend/src/app/pos/page.tsx', 'w', encoding='utf-8') as f:
 f.write(c)
