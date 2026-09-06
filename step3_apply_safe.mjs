import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// 1. Fix newProduct initialization
content = content.replace(
    /const \[newProduct, setNewProduct\] = useState<\{.*?\}\>\(\{.*?\}\);/,
    `const [newProduct, setNewProduct] = useState<{name: string, category: string, price: number, cogs: number, stock: number, image_icon: string, image_url: string, discount_percentage: number, options_config: any[], ingredients: {raw_material_id: string, name: string, qty: number, cost: number}[]}>({ name: '', category: 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', discount_percentage: 0, options_config: [], ingredients: [] });`
);

// 2. Add chart to raw_materials tab
const rawMaterialChartCode = `
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl p-6">
                                        <h3 className="font-bold text-lg mb-4 text-white border-b border-gray-800 pb-3">Konversi Nilai Stok Bahan Baku</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <div className="text-sm text-gray-400 mb-2">Total Nilai Aset Bahan Baku:</div>
                                                <div className="text-3xl font-bold text-blue-400">
                                                    Rp {rawMaterials.reduce((sum, item) => sum + (item.current_stock * item.last_price_per_unit), 0).toLocaleString('id-ID')}
                                                </div>
                                                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                                                    {rawMaterials.map(item => (
                                                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                                                            <span className="text-gray-300">{item.name}</span>
                                                            <div className="text-right">
                                                                <div className="font-bold text-white">Rp {(item.current_stock * item.last_price_per_unit).toLocaleString('id-ID')}</div>
                                                                <div className="text-xs text-gray-500">{item.current_stock} {item.unit} @ Rp {item.last_price_per_unit.toLocaleString('id-ID')}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="h-64 flex items-end gap-2 pb-4 pt-4 border-l border-gray-800 pl-4 overflow-x-auto">
                                                {rawMaterials.length > 0 && rawMaterials.map(item => {
                                                    const totalVal = item.current_stock * item.last_price_per_unit;
                                                    const maxVal = Math.max(...rawMaterials.map(m => m.current_stock * m.last_price_per_unit));
                                                    const heightPct = maxVal > 0 ? (totalVal / maxVal) * 100 : 0;
                                                    return (
                                                        <div key={item.id} className="flex flex-col justify-end items-center h-full w-12 group flex-shrink-0">
                                                            <div className="text-xs text-gray-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 p-1 rounded z-10 absolute -translate-y-full">
                                                                Rp {totalVal.toLocaleString('id-ID')}
                                                            </div>
                                                            <div className="w-8 bg-blue-500/80 rounded-t-sm hover:bg-blue-400 transition-colors" style={{ height: \`\${heightPct}%\` }}></div>
                                                            <div className="text-[10px] text-gray-500 mt-2 truncate w-full text-center" title={item.name}>{item.name.substring(0, 5)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
`;

content = content.replace(
    /\{activeTab === "raw_materials" && \(\s*<div className="space-y-8">/,
    `{activeTab === "raw_materials" && (\n                                <div className="space-y-8">\n${rawMaterialChartCode}`
);

// 3. Add discount and options_config to product forms
content = content.replace(
    /<input type="number" placeholder="Stok" required value={newProduct.stock/g,
    `<input type="number" placeholder="Diskon (%)" value={newProduct.discount_percentage || ''} onChange={e => setNewProduct({...newProduct, discount_percentage: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white transition-colors" />\n                                                <input type="number" placeholder="Stok" required value={newProduct.stock`
);

content = content.replace(
    /<input type="number" placeholder="Stok" required value={editingProduct.stock/g,
    `<input type="number" placeholder="Diskon (%)" value={editingProduct.discount_percentage || ''} onChange={e => setEditingProduct({...editingProduct, discount_percentage: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white transition-colors" />\n                                                    <input type="number" placeholder="Stok" required value={editingProduct.stock`
);

const newProductOptionsEditor = `
<div className="mt-4 border-t border-gray-800 pt-4">
    <ProductOptionsEditor 
        options={newProduct.options_config || []} 
        onChange={(newOptions) => setNewProduct({...newProduct, options_config: newOptions})} 
    />
</div>
`;
content = content.replace(
    /(<button type="submit" disabled=\{loading\} className="w-full py-[34] bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500[\s\S]*?>\{loading \? 'Menyimpan\.\.\.' : 'Simpan Produk'\}<\/button>)/,
    `${newProductOptionsEditor}\n$1`
);

const editProductOptionsEditor = `
<div className="mt-4 border-t border-gray-800 pt-4">
    <ProductOptionsEditor 
        options={editingProduct.options_config || []} 
        onChange={(newOptions) => setEditingProduct({...editingProduct, options_config: newOptions})} 
    />
</div>
`;
content = content.replace(
    /(<div className="flex gap-3 mt-4">\s*<button type="button" onClick=\{\(\) => setEditingProduct\(null\)\} className="flex-1 py-[34] bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal<\/button>\s*<button type="submit" disabled=\{loading\} className="flex-1 py-[34] bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Perubahan<\/button>)/,
    `${editProductOptionsEditor}\n$1`
);

// 4. Update the products table to show options and discount
content = content.replace(
    /<td className="p-4 text-right font-bold text-green-400 whitespace-nowrap">Rp \{prod\.price\.toLocaleString\('id-ID'\)\}<\/td>/g,
    `<td className="p-4 text-right whitespace-nowrap">
        {prod.discount_percentage > 0 ? (
            <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 line-through">Rp {prod.price.toLocaleString('id-ID')}</span>
                <span className="font-bold text-green-400">Rp {(prod.price * (1 - prod.discount_percentage / 100)).toLocaleString('id-ID')}</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded mt-1">{prod.discount_percentage}% OFF</span>
            </div>
        ) : (
            <span className="font-bold text-green-400">Rp {prod.price.toLocaleString('id-ID')}</span>
        )}
    </td>`
);

content = content.replace(
    /<td className="p-4"><span className="px-3 py-1 bg-gray-800 rounded-lg text-sm">\{prod\.stock\}<\/span><\/td>/g,
    `<td className="p-4">
        <span className="px-3 py-1 bg-gray-800 rounded-lg text-sm">{prod.stock}</span>
        {prod.options_config && prod.options_config.length > 0 && (
            <div className="text-xs text-blue-400 mt-2">+{prod.options_config.length} Addons</div>
        )}
    </td>`
);


fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Successfully applied all new features.");
