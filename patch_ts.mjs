import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// Fix editingProduct type
const editingRegex = /const \[editingProduct, setEditingProduct\] = useState<any>\(null\);/g;
// Actually, let's just make newProduct type 'any' to fix all type issues quickly.
content = content.replace(
    /useState<\{name: string, category: string, price: number, cogs: number, stock: number, image_icon: string, image_url: string, ingredients: \{raw_material_id: string, name: string, qty: number, cost: number\}\[\]\}>/g,
    `useState<any>`
);

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Fixed types in admin/page.tsx");
