import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// 1. Update newProduct state
content = content.replace(
    /const \[newProduct, setNewProduct\] = useState<\{([^}]+)\}>\(\{([^}]+)\}\);/g,
    `const [newProduct, setNewProduct] = useState<{name: string, category: string, price: number, cogs: number, stock: number, image_icon: string, image_url: string, discount_percentage: number, options_config: any[], ingredients: any[]}>({ 
        name: '', category: 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', discount_percentage: 0, options_config: [], ingredients: [] 
    });`
);

// 2. Update handleCreateProduct body
content = content.replace(
    /ingredients: newProduct.ingredients,\n\s*image_url: newProduct.image_url\n\s*\}\)/g,
    `ingredients: newProduct.ingredients,
                    image_url: newProduct.image_url,
                    discount_percentage: Number(newProduct.discount_percentage) || 0,
                    options_config: newProduct.options_config
                })`
);

// 3. Update setNewProduct reset in handleCreateProduct
content = content.replace(
    /setNewProduct\(\{ name: '', category: storeSettings.categories\?\.\[0\] \|\| 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', ingredients: \[\] \}\);/g,
    `setNewProduct({ name: '', category: storeSettings.categories?.[0] || 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', discount_percentage: 0, options_config: [], ingredients: [] });`
);

// 4. Update editingProduct payload in handleUpdateProduct
content = content.replace(
    /image_url: editingProduct.image_url \|\| null,\n\s*ingredients: editingProduct.ingredients\n\s*\}\)/g,
    `image_url: editingProduct.image_url || null,
                    ingredients: editingProduct.ingredients,
                    discount_percentage: Number(editingProduct.discount_percentage) || 0,
                    options_config: editingProduct.options_config || []
                })`
);

// 5. Add Discount Input to newProduct Form
const newProductFormRowRegex = /(<div><label className="text-xs text-gray-500 mb-2 block">Stok Awal<\/label><input type="number" placeholder="0" required value=\{newProduct\.stock\}[^>]+><\/div>)/;
content = content.replace(newProductFormRowRegex, 
    `$1
<div><label className="text-xs text-gray-500 mb-2 block">Diskon (%)</label><input type="number" placeholder="0" value={newProduct.discount_percentage} onChange={e => setNewProduct({...newProduct, discount_percentage: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" max="100" /></div>`
);

// 6. Add Discount Input to editingProduct Form
const editingProductFormRowRegex = /(<div><label className="text-xs text-gray-500 mb-2 block">Stok<\/label><input type="number" placeholder="0" required value=\{editingProduct\.stock\}[^>]+><\/div>)/;
content = content.replace(editingProductFormRowRegex, 
    `$1
<div><label className="text-xs text-gray-500 mb-2 block">Diskon (%)</label><input type="number" placeholder="0" value={editingProduct.discount_percentage} onChange={e => setEditingProduct({...editingProduct, discount_percentage: Number(e.target.value)})} className="w-full p-3 bg-[#0B0F19] border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" max="100" /></div>`
);


fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Updated admin/page.tsx");
