const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/customer/page.tsx', 'utf8');

if (!c.includes('showMobileCart')) {
    c = c.replace('const [customerName, setCustomerName] = useState<string>(");', 'const [customerName, setCustomerName] = useState<string>();\n const [showMobileCart, setShowMobileCart] = useState(false);');
}

c = c.replace('<div className=w-full lg:w-[65%] flex flex-col h-[50vh] lg:h-screen>', '<div className=w-full lg:w-[65%] flex flex-col h-screen>');

c = c.replace(/\{\/\* SIDEBAR CART \(35\%\) \*\/\}\s*<div className=w-full lg:w-\[35\%\] bg-\[\#0B0F19\] border-l border-gray-800 flex flex-col shadow-2xl z-10>/m, {/* SIDEBAR CART (35%) */}
 <div className={\\ lg:relative lg:inset-auto lg:z-10 w-full lg:w-[35%] bg-[#0B0F19] lg:border-l border-gray-800 flex-col shadow-2xl transition-all\}>
 {showMobileCart && (
 <button onClick={() => setShowMobileCart(false)} className=lg:hidden absolute top-4 right-4 p-2 bg-gray-800 rounded-full text-white z-50>
 X
 </button>
 )});

c = c.replace('Pesan Sekarang', 'Pesan Sekarang'); // no change, just anchoring

if (!c.includes('lg:hidden fixed bottom-0')) {
 c = c.replace('{/* FULLSCREEN POPUP OVERLAY */}', 
 {/* MOBILE BOTTOM BAR */}
 {!showMobileCart && cart.length > 0 && orderStatus === 'idle' && (
 <div className=lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-blue-600 text-white flex justify-between items-center rounded-t-3xl shadow-[0_-10px_40px_rgba(37,99,235,0.3)] z-40 animate-in slide-in-from-bottom-full onClick={() => setShowMobileCart(true)}>
 <div className=flex items-center gap-3>
 <div className=relative>
 <ShoppingBag className=w-6 h-6 />
 <span className=absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full>{cart.reduce((s, i) => s + i.qty, 0)}</span>
 </div>
 <div className=flex flex-col>
 <span className=text-xs text-blue-200>Total Pesanan</span>
 <span className=font-bold>Rp {grandTotal.toLocaleString(id-ID)}</span>
 </div>
 </div>
 <button className=bg-white text-blue-600 px-6 py-2 rounded-xl font-black text-sm hover:bg-gray-100 transition-colors>
 Lihat
 </button>
 </div>
 )}
 
 {/* FULLSCREEN POPUP OVERLAY */});
}

// Ensure the mobile cart gets closed when payment finishes or goes to waiting state
c = c.replace('setOrderStatus(\'waiting_payment\');', 'setOrderStatus(\'waiting_payment\');\n setShowMobileCart(false);');

fs.writeFileSync('frontend/src/app/customer/page.tsx', c);
