import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// Restore the type definition and add the new fields properly
content = content.replace(
    /useState<any>\(\{/g,
    `useState<{name: string, category: string, price: number, cogs: number, stock: number, image_icon: string, image_url: string, discount_percentage: number, options_config: any[], ingredients: {raw_material_id: string, name: string, qty: number, cost: number}[]}>({`
);

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Restored types in admin/page.tsx");
