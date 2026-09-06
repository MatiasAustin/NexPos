import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

if (!content.includes('import ProductOptionsEditor')) {
    content = content.replace(
        /import ReportChart from "@\/components\/ReportChart";/,
        `import ReportChart from "@/components/ReportChart";\nimport ProductOptionsEditor from "@/components/ProductOptionsEditor";`
    );
}

// 1. Add to newProduct form (right before ingredients section)
const newProductIngredientsRegex = /(<div className="mb-6 p-4 md:p-5 bg-gray-900 border border-gray-800 rounded-xl">[\s\S]*?<h4 className="font-bold text-gray-300">Bahan Baku \(Opsional\)<\/h4>)/;
content = content.replace(newProductIngredientsRegex,
    `<ProductOptionsEditor options={newProduct.options_config} onChange={(opts) => setNewProduct({...newProduct, options_config: opts})} />\n$1`
);

// 2. Add to editingProduct form
const editingProductIngredientsRegex = /(<div className="mb-6 p-4 md:p-5 bg-[#0B0F19] border border-gray-800 rounded-xl">[\s\S]*?<h4 className="font-bold text-gray-300">Bahan Baku \(Opsional\)<\/h4>)/;
content = content.replace(editingProductIngredientsRegex,
    `<ProductOptionsEditor options={editingProduct.options_config || []} onChange={(opts) => setEditingProduct({...editingProduct, options_config: opts})} />\n$1`
);


fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Updated admin/page.tsx with ProductOptionsEditor");
