import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// ============================================================
// 1. Add import for ProductOptionsEditor
// ============================================================
if (!content.includes("ProductOptionsEditor")) {
    content = content.replace(
        `import { LoadingSpinner, SkeletonCard, SkeletonTable } from "@/components/Loading";`,
        `import { LoadingSpinner, SkeletonCard, SkeletonTable } from "@/components/Loading";
import ProductOptionsEditor from "@/components/ProductOptionsEditor";`
    );
}

// ============================================================
// 2. Add discount_percentage and options_config to newProduct state
// ============================================================
content = content.replace(
    `name: '', category: 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', ingredients: []`,
    `name: '', category: 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', discount_percentage: 0, options_config: [], ingredients: []`
);

// ============================================================
// 3. Add discount input in the new product form BEFORE submit button
// ============================================================
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

content = content.replace(
    `<button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">
                                            {loading ? 'Menyimpan...' : 'Simpan Produk'}
                                        </button>`,
    discountInputForNew + `<button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">
                                            {loading ? 'Menyimpan...' : 'Simpan Produk'}
                                        </button>`
);

// ============================================================
// 4. Add discount and options in the edit product modal BEFORE "Batal" button
// ============================================================
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
    `<div className="flex gap-4 mt-6">
                                                        <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Perubahan</button>
                                                    </div>`,
    discountInputForEdit + `<div className="flex gap-4 mt-6">
                                                        <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Perubahan</button>
                                                    </div>`
);

// ============================================================
// 5. Update handleCreateProduct and handleUpdateProduct to include discount_percentage and options_config
// ============================================================
content = content.replace(
    `body: JSON.stringify({
                    ...newProduct,
                    price: Number(newProduct.price),
                    cogs: computedCogs,
                    stock: Number(newProduct.stock),
                    ingredients: newProduct.ingredients
                })`,
    `body: JSON.stringify({
                    ...newProduct,
                    price: Number(newProduct.price),
                    cogs: computedCogs,
                    stock: Number(newProduct.stock),
                    ingredients: newProduct.ingredients,
                    discount_percentage: Number(newProduct.discount_percentage || 0),
                    options_config: newProduct.options_config || []
                })`
);

// Reset newProduct after save: add discount_percentage and options_config
content = content.replace(
    `setNewProduct({ name: '', category: 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', ingredients: [] });`,
    `setNewProduct({ name: '', category: 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', discount_percentage: 0, options_config: [], ingredients: [] });`
);

// Update handleUpdateProduct body to include discount and options
content = content.replace(
    `body: JSON.stringify({
                    name: editingProduct.name,
                    category: editingProduct.category,
                    price: Number(editingProduct.price),
                    cogs: computedCogs,
                    stock: Number(editingProduct.stock),
                    image_icon: editingProduct.image_icon,
                    image_url: editingProduct.image_url,
                    ingredients: editingProduct.ingredients
                })`,
    `body: JSON.stringify({
                    name: editingProduct.name,
                    category: editingProduct.category,
                    price: Number(editingProduct.price),
                    cogs: computedCogs,
                    stock: Number(editingProduct.stock),
                    image_icon: editingProduct.image_icon,
                    image_url: editingProduct.image_url,
                    ingredients: editingProduct.ingredients,
                    discount_percentage: Number(editingProduct.discount_percentage || 0),
                    options_config: editingProduct.options_config || []
                })`
);

// ============================================================
// 6. Show discount badge in products table
// ============================================================
// Find the price column in the products table and add discount display
content = content.replace(
    `<td className="p-2 md:p-4 text-right">
                                                            <p className="font-bold text-gray-200">Rp {p.price.toLocaleString('id-ID')}</p>`,
    `<td className="p-2 md:p-4 text-right">
                                                            {(p.discount_percentage || 0) > 0 ? (
                                                                <div>
                                                                    <p className="text-xs text-gray-500 line-through">Rp {p.price.toLocaleString('id-ID')}</p>
                                                                    <p className="font-bold text-green-400">Rp {(p.price * (1 - p.discount_percentage / 100)).toLocaleString('id-ID')}</p>
                                                                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">{p.discount_percentage}% OFF</span>
                                                                </div>
                                                            ) : (
                                                                <p className="font-bold text-gray-200">Rp {p.price.toLocaleString('id-ID')}</p>
                                                            )}`
);

// Close the extra td opened in the price column (if needed - check structure)
// Find HPP line and ensure it's still inside the td
content = content.replace(
    `<p className="text-xs text-gray-500">
                                                                HPP: Rp {p.cogs.toLocaleString('id-ID')}`,
    `<p className="text-xs text-gray-500">
                                                                HPP: Rp {p.cogs.toLocaleString('id-ID')}`
);

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Step 2 completed: Added discount and ProductOptionsEditor to inventory forms.");
