const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// 1. Remove Bahan Baku from Expenses Tab
const expensesTabStart = c.indexOf('{activeTab === "expenses" && (');
if (expensesTabStart !== -1) {
    const expensesTabEnd = c.indexOf('{/* RAW MATERIALS TAB */}', expensesTabStart);
    if (expensesTabEnd !== -1) {
        let expensesContent = c.substring(expensesTabStart, expensesTabEnd);
        const inputBlockStart = expensesContent.indexOf('{/* Bahan Baku */}');
        const inputBlockEnd = expensesContent.indexOf('{/* Pengeluaran */}');
        if (inputBlockStart !== -1 && inputBlockEnd !== -1) expensesContent = expensesContent.substring(0, inputBlockStart) + expensesContent.substring(inputBlockEnd);
        expensesContent = expensesContent.replace('lg:grid-cols-2', 'lg:grid-cols-1');
        const tableHeader = '<h3 className="p-2 md:p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Daftar Bahan Baku</h3>';
        const tableIdx = expensesContent.indexOf(tableHeader);
        if (tableIdx !== -1) {
            const tableDivStart = expensesContent.lastIndexOf('<div', tableIdx);
            const tableDivEndStr = '{/* Pengeluaran */}';
            const nextDivStart = expensesContent.indexOf(tableDivEndStr, tableIdx);
            if (tableDivStart !== -1 && nextDivStart !== -1) expensesContent = expensesContent.substring(0, tableDivStart) + expensesContent.substring(nextDivStart);
        }
        expensesContent = expensesContent.replace('lg:grid-cols-2', 'lg:grid-cols-1');
        const logsStart = expensesContent.indexOf('{/* Material Stock Logs Row */}');
        if (logsStart !== -1) {
            // ONLY replace the logs row up to its end closing div!
            const logsEnd = expensesContent.indexOf('</div>\n                                    </div>\n', logsStart);
            if(logsEnd !== -1) {
                 expensesContent = expensesContent.substring(0, logsStart) + expensesContent.substring(logsEnd + '</div>\n                                    </div>\n'.length);
            } else {
                 expensesContent = expensesContent.substring(0, logsStart) + '</div>\n                                </div>\n                            )}\n                            ';
            }
        }
        c = c.substring(0, expensesTabStart) + expensesContent + c.substring(expensesTabEnd);
    }
}

if (!c.includes('discount_percentage: 0, options_config: []')) {
    const startIdx = c.indexOf("name: '', category: 'Makanan'");
    const endIdx = c.indexOf("ingredients: []", startIdx);
    if (startIdx !== -1 && endIdx !== -1) c = c.substring(0, startIdx) + c.substring(startIdx, endIdx) + "discount_percentage: 0, options_config: [], ingredients: []" + c.substring(endIdx + "ingredients: []".length);
}
if (!c.includes('options_config: newProduct.options_config')) {
    const handleCreate = c.indexOf('ingredients: newProduct.ingredients');
    if (handleCreate !== -1) c = c.substring(0, handleCreate) + 'ingredients: newProduct.ingredients,\n                    discount_percentage: Number(newProduct.discount_percentage || 0),\n                    options_config: newProduct.options_config || []' + c.substring(handleCreate + 'ingredients: newProduct.ingredients'.length);
}
if (!c.includes('options_config: editingProduct.options_config')) {
    const handleUpdate = c.indexOf('ingredients: editingProduct.ingredients');
    if (handleUpdate !== -1) c = c.substring(0, handleUpdate) + 'ingredients: editingProduct.ingredients,\n                    discount_percentage: Number(editingProduct.discount_percentage || 0),\n                    options_config: editingProduct.options_config || []' + c.substring(handleUpdate + 'ingredients: editingProduct.ingredients'.length);
}

const realBtnCreate = c.substring(c.indexOf('<button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">'), c.indexOf('</button>', c.indexOf('Simpan Produk')) + 9);
if (!c.includes('Diskon & Opsi Produk') && realBtnCreate.length > 10) {
    const discountUi = `
                                        <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                                            <h4 className="font-bold text-gray-300 mb-4">Diskon & Opsi Produk</h4>
                                            <div className="mb-4">
                                                <label className="text-xs text-gray-500 mb-1 block">Diskon (%)</label>
                                                <input type="number" placeholder="0" min="0" max="100" value={newProduct.discount_percentage || ''} onChange={e => setNewProduct({...newProduct, discount_percentage: Number(e.target.value)})} className="w-full p-3 bg-[#0B0F19] border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                {(newProduct.discount_percentage || 0) > 0 && <p className="text-xs text-green-400 mt-1">Harga setelah diskon: Rp {(newProduct.price * (1 - (newProduct.discount_percentage || 0) / 100)).toLocaleString('id-ID')}</p>}
                                            </div>
                                            <ProductOptionsEditor options={newProduct.options_config || []} onChange={(newOptions) => setNewProduct({...newProduct, options_config: newOptions})} />
                                        </div>\n`;
    c = c.replace(realBtnCreate, discountUi + '                                        ' + realBtnCreate);
}

const editBtnStartIdx = c.indexOf('<div className="flex gap-4 mt-6">', c.indexOf('setEditingProduct(null)') - 100);
if (editBtnStartIdx !== -1) {
    const realBtnEdit = c.substring(editBtnStartIdx, c.indexOf('</div>', c.indexOf('setEditingProduct(null)')) + 6);
    if (realBtnEdit.length > 10 && !c.includes('value={editingProduct.discount_percentage')) {
        const editUiStr = `
                                                    <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                                                        <h4 className="font-bold text-gray-300 mb-4">Diskon & Opsi Produk</h4>
                                                        <div className="mb-4">
                                                            <label className="text-xs text-gray-500 mb-1 block">Diskon (%)</label>
                                                            <input type="number" placeholder="0" min="0" max="100" value={editingProduct.discount_percentage || ''} onChange={e => setEditingProduct({...editingProduct, discount_percentage: Number(e.target.value)})} className="w-full p-3 bg-[#0B0F19] border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                            {(editingProduct.discount_percentage || 0) > 0 && <p className="text-xs text-green-400 mt-1">Harga setelah diskon: Rp {(editingProduct.price * (1 - (editingProduct.discount_percentage || 0) / 100)).toLocaleString('id-ID')}</p>}
                                                        </div>
                                                        <ProductOptionsEditor options={editingProduct.options_config || []} onChange={(newOptions) => setEditingProduct({...editingProduct, options_config: newOptions})} />
                                                    </div>\n`;
        c = c.replace(realBtnEdit, editUiStr + '                                                    ' + realBtnEdit);
    }
}

if (!c.includes('line-through')) {
    const tablePrice = `<p className="font-bold text-gray-200">Rp {p.price.toLocaleString('id-ID')}</p>`;
    const tableDiscount = `{(p.discount_percentage || 0) > 0 ? (
                                                                <div>
                                                                    <p className="text-xs text-gray-500 line-through">Rp {p.price.toLocaleString('id-ID')}</p>
                                                                    <p className="font-bold text-green-400">Rp {(p.price * (1 - p.discount_percentage / 100)).toLocaleString('id-ID')}</p>
                                                                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">{p.discount_percentage}% OFF</span>
                                                                </div>
                                                            ) : (
                                                                <p className="font-bold text-gray-200">Rp {p.price.toLocaleString('id-ID')}</p>
                                                            )}`;
    c = c.replace(tablePrice, tableDiscount);
}

fs.writeFileSync('frontend/src/app/admin/page.tsx', c, 'utf-8');
console.log('Fixed page safely v4');
