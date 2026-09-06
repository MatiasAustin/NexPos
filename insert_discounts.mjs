import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// 1. Add discount_percentage and options_config to the state initialization
content = content.replace(
    `const [newProduct, setNewProduct] = useState<{name: string, category: string, price: number, cogs: number, stock: number, image_icon: string, image_url: string, ingredients: {raw_material_id: string, name: string, qty: number, cost: number}[]}>({`,
    `const [newProduct, setNewProduct] = useState<{name: string, category: string, price: number, cogs: number, stock: number, image_icon: string, image_url: string, discount_percentage?: number, options_config?: any[], ingredients: {raw_material_id: string, name: string, qty: number, cost: number}[]}>({`
);

content = content.replace(
    `name: '', category: 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', ingredients: []`,
    `name: '', category: 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', discount_percentage: 0, options_config: [], ingredients: []`
);

// 2. Add to handleCreateProduct payload
content = content.replace(
    `ingredients: newProduct.ingredients\n                })`,
    `ingredients: newProduct.ingredients,\n                    discount_percentage: Number(newProduct.discount_percentage || 0),\n                    options_config: newProduct.options_config || []\n                })`
);

// 3. Add to handleUpdateProduct payload
content = content.replace(
    `ingredients: editingProduct.ingredients\n                })`,
    `ingredients: editingProduct.ingredients,\n                    discount_percentage: Number(editingProduct.discount_percentage || 0),\n                    options_config: editingProduct.options_config || []\n                })`
);

// 4. Add UI for newProduct
const discountInputForNew = `
                                        <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                                            <h4 className="font-bold text-gray-300 mb-4 flex items-center gap-2">
                                                <span>Diskon & Opsi Produk</span>
                                            </h4>
                                            <div className="mb-4">
                                                <label className="text-xs text-gray-500 mb-1 block">Diskon (%)</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="0" 
                                                    min="0" max="100"
                                                    value={newProduct.discount_percentage || ''} 
                                                    onChange={e => setNewProduct({...newProduct, discount_percentage: Number(e.target.value)})} 
                                                    className="w-full p-3 bg-[#0B0F19] border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" 
                                                />
                                                {(newProduct.discount_percentage || 0) > 0 && (
                                                    <p className="text-xs text-green-400 mt-1">
                                                        Harga setelah diskon: Rp {(newProduct.price * (1 - (newProduct.discount_percentage || 0) / 100)).toLocaleString('id-ID')}
                                                    </p>
                                                )}
                                            </div>
                                            <ProductOptionsEditor 
                                                options={newProduct.options_config || []} 
                                                onChange={(newOptions) => setNewProduct({...newProduct, options_config: newOptions})} 
                                            />
                                        </div>
`;

if (!content.includes('Diskon & Opsi Produk')) {
    content = content.replace(
        `<button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">\n                                            {loading ? 'Menyimpan...' : 'Simpan Produk'}\n                                        </button>`,
        discountInputForNew + `\n                                        <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">\n                                            {loading ? 'Menyimpan...' : 'Simpan Produk'}\n                                        </button>`
    );

    const discountInputForEdit = `
                                                    <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                                                        <h4 className="font-bold text-gray-300 mb-4">Diskon & Opsi Produk</h4>
                                                        <div className="mb-4">
                                                            <label className="text-xs text-gray-500 mb-1 block">Diskon (%)</label>
                                                            <input 
                                                                type="number" 
                                                                placeholder="0"
                                                                min="0" max="100"
                                                                value={editingProduct.discount_percentage || ''} 
                                                                onChange={e => setEditingProduct({...editingProduct, discount_percentage: Number(e.target.value)})} 
                                                                className="w-full p-3 bg-[#0B0F19] border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" 
                                                            />
                                                            {(editingProduct.discount_percentage || 0) > 0 && (
                                                                <p className="text-xs text-green-400 mt-1">
                                                                    Harga setelah diskon: Rp {(editingProduct.price * (1 - (editingProduct.discount_percentage || 0) / 100)).toLocaleString('id-ID')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <ProductOptionsEditor 
                                                            options={editingProduct.options_config || []} 
                                                            onChange={(newOptions) => setEditingProduct({...editingProduct, options_config: newOptions})} 
                                                        />
                                                    </div>
    `;
    
    content = content.replace(
        `<div className="flex gap-4 mt-6">\n                                                        <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>\n                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Perubahan</button>\n                                                    </div>`,
        discountInputForEdit + `\n                                                    <div className="flex gap-4 mt-6">\n                                                        <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>\n                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Perubahan</button>\n                                                    </div>`
    );
}

// 5. Replace table cell
if (!content.includes('line-through')) {
    content = content.replace(
        `<td className="p-2 md:p-4 text-right">\n                                                                <p className="font-bold text-gray-200">Rp {p.price.toLocaleString('id-ID')}</p>`,
        `<td className="p-2 md:p-4 text-right">\n                                                                {(p.discount_percentage || 0) > 0 ? (\n                                                                    <div>\n                                                                        <p className="text-xs text-gray-500 line-through">Rp {p.price.toLocaleString('id-ID')}</p>\n                                                                        <p className="font-bold text-green-400">Rp {(p.price * (1 - p.discount_percentage / 100)).toLocaleString('id-ID')}</p>\n                                                                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">{p.discount_percentage}% OFF</span>\n                                                                    </div>\n                                                                ) : (\n                                                                    <p className="font-bold text-gray-200">Rp {p.price.toLocaleString('id-ID')}</p>\n                                                                )}`
    );
}

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log('done');
