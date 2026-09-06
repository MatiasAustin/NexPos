import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/pos/page.tsx', 'utf-8');

// 1. Add state for Options Modal
const stateRegex = /(const \[loading, setLoading\] = useState\(false\);)/;
content = content.replace(stateRegex,
    `$1\n    const [showOptionsModal, setShowOptionsModal] = useState(false);\n    const [selectedProductForOptions, setSelectedProductForOptions] = useState<any>(null);\n    const [selectedOptions, setSelectedOptions] = useState<any>({});`
);

// 2. Change addToCart click handler
const clickProductRegex = /onClick=\{\(\) => addToCart\(product\)\}/g;
content = content.replace(clickProductRegex,
    `onClick={() => {
        if (product.options_config && product.options_config.length > 0) {
            setSelectedProductForOptions(product);
            const initialOpts: any = {};
            product.options_config.forEach((cat: any) => {
                if (cat.choices && cat.choices.length > 0) {
                    initialOpts[cat.name] = cat.choices[0]; // Default to first choice
                }
            });
            setSelectedOptions(initialOpts);
            setShowOptionsModal(true);
        } else {
            addToCart(product);
        }
    }}`
);

// 3. Update addToCart to handle options
const addToCartRegex = /(const addToCart = \(product: any\) => \{)/;
content = content.replace(addToCartRegex,
    `const addToCart = (product: any, options: any = null) => {
        const optionAddon = options ? Object.values(options).reduce((sum: number, choice: any) => sum + (Number(choice.price_adjustment) || 0), 0) : 0;
        const optionsString = options ? Object.entries(options).map(([k, v]: any) => \`\${k}: \${v.name}\`).join(', ') : '';
        
        // Add addon price to base product price before discount, or after? Usually before.
        const basePrice = product.price + optionAddon;
        const finalPrice = product.discount_percentage > 0 ? basePrice * (1 - product.discount_percentage / 100) : basePrice;
        
        const finalProduct = {
            ...product,
            id: product.id + (optionsString ? '-' + Date.now() : ''), // unique ID so different options don't stack
            name: product.name + (optionsString ? \` (\${optionsString})\` : ''),
            original_price: product.price,
            price: finalPrice,
            modifiers: options
        };
        
        setCart((prev) => {
            // Because we changed the ID for options, they will stack separately
            const existing = prev.find((p) => p.product.id === finalProduct.id);
            if (existing) {
                return prev.map((p) =>
                    p.product.id === finalProduct.id ? { ...p, qty: p.qty + 1 } : p
                );
            }
            return [...prev, { product: finalProduct, qty: 1 }];
        });
    };
    
    // Ignore the old addToCart implementation to prevent redeclaration
    /*`
);
const addToCartEndRegex = /(return \[\.\.\.prev, \{ product: \{ \.\.\.product, original_price: product\.price, price: finalPrice \}, qty: 1 \}\];\n\s*\}\);\n\s*\};)/;
content = content.replace(addToCartEndRegex, `$1\n    */`);

// 4. Render the Options Modal
const modalRenderRegex = /(<ConfirmDialog \/>)/;
content = content.replace(modalRenderRegex,
    `$1
    {showOptionsModal && selectedProductForOptions && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1c] p-6 rounded-2xl w-full max-w-md shadow-2xl border border-gray-800 relative max-h-[90vh] flex flex-col">
                <button onClick={() => setShowOptionsModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                <h2 className="text-xl font-bold mb-1 text-white">{selectedProductForOptions.name}</h2>
                <p className="text-gray-400 text-sm mb-6">Pilih opsi untuk pesanan ini</p>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {selectedProductForOptions.options_config.map((cat: any, i: number) => (
                        <div key={i}>
                            <h3 className="font-bold text-gray-300 mb-3">{cat.name}</h3>
                            <div className="space-y-2">
                                {cat.choices.map((choice: any, j: number) => (
                                    <label key={j} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                                        <input 
                                            type="radio" 
                                            name={cat.name} 
                                            checked={selectedOptions[cat.name]?.name === choice.name}
                                            onChange={() => setSelectedOptions({...selectedOptions, [cat.name]: choice})}
                                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-600"
                                        />
                                        <div className="flex-1 text-white text-sm">{choice.name}</div>
                                        {Number(choice.price_adjustment) > 0 && <div className="text-blue-400 text-xs font-bold">+Rp {Number(choice.price_adjustment).toLocaleString('id-ID')}</div>}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-800">
                    <button 
                        onClick={() => {
                            addToCart(selectedProductForOptions, selectedOptions);
                            setShowOptionsModal(false);
                        }}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors"
                    >
                        Tambahkan ke Keranjang
                    </button>
                </div>
            </div>
        </div>
    )}`
);

fs.writeFileSync('frontend/src/app/pos/page.tsx', content, 'utf-8');
console.log("Updated pos/page.tsx with Options Modal");
