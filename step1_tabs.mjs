import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// 1. Add raw_materials to activeTab type
content = content.replace(
    /useState<"reconciliation" \| "audit" \| "staff" \| "inventory" \| "history" \| "settings" \| "expenses">/g,
    `useState<"reconciliation" | "audit" | "staff" | "inventory" | "history" | "settings" | "expenses" | "raw_materials">`
);

// 2. Update the sidebar menu
content = content.replace(
    /\{ id: "inventory", label: "Produk & Stok", icon: Package \},\s*\{ id: "expenses", label: "Bahan & Pengeluaran", icon: FileText \},/,
    `{ id: "inventory", label: "Produk & Stok", icon: Package },
                        { id: "raw_materials", label: "Bahan Baku", icon: Package },
                        { id: "expenses", label: "Pengeluaran", icon: FileText },`
);

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Updated activeTab and sidebar menu.");
