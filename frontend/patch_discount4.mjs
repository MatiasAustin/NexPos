import fs from 'fs';

const filePath = 'd:\\WORK\\BUILD_APP\\NexPos\\frontend\\src\\app\\pos\\page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');
content = content.replace(/\r\n/g, '\n');

const oldCode = `            await Promise.all([
                ...Object.keys(prodStockUpdates).map(async prodId => {
                    const prod = products.find(p => p.id === prodId);
                    if (prod) {
                        const newStock = Number(prod.stock) - prodStockUpdates[prodId];
                        await supabase.from('products').update({ stock: newStock }).eq('id', prodId);
                    }
                }),
                ...Object.keys(matStockUpdates).map(async matId => {
                    const { delta, products: prodNames } = matStockUpdates[matId];
                    const { data: matData } = await supabase.from('raw_materials').select('current_stock, name').eq('id', matId).single();
                    if (matData) {
                        const newStock = Number(matData.current_stock) - delta;
                        await supabase.from('raw_materials').update({ current_stock: newStock }).eq('id', matId);
                        await supabase.from('material_stock_logs').insert([{
                            material_id: matId,
                            material_name: matData.name,
                            delta: -delta,
                            current_stock: newStock,
                            note: \`Terjual: \${Array.from(new Set(prodNames)).join(', ')} (Ref: \${orderRef})\`,
                            staff_name: staff?.full_name || 'System'
                        }]);
                    }
                })
            ]);`;

const newCode = `            // Run stock deduction in the background (fire and forget) to avoid blocking the UI
            Promise.all([
                ...Object.keys(prodStockUpdates).map(async prodId => {
                    const prod = products.find(p => p.id === prodId);
                    if (prod) {
                        const newStock = Number(prod.stock) - prodStockUpdates[prodId];
                        await supabase.from('products').update({ stock: newStock }).eq('id', prodId);
                    }
                }),
                ...Object.keys(matStockUpdates).map(async matId => {
                    const { delta, products: prodNames } = matStockUpdates[matId];
                    const { data: matData } = await supabase.from('raw_materials').select('current_stock, name').eq('id', matId).single();
                    if (matData) {
                        const newStock = Number(matData.current_stock) - delta;
                        await supabase.from('raw_materials').update({ current_stock: newStock }).eq('id', matId);
                        await supabase.from('material_stock_logs').insert([{
                            material_id: matId,
                            material_name: matData.name,
                            delta: -delta,
                            current_stock: newStock,
                            note: \`Terjual: \${Array.from(new Set(prodNames)).join(', ')} (Ref: \${orderRef})\`,
                            staff_name: staff?.full_name || 'System'
                        }]);
                    }
                })
            ]).catch(err => console.error("Stock background deduction error:", err));`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(filePath, content);
console.log("Patched await Promise.all");
