import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

const rawMaterialChartCode = `
<div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl mb-6 p-6">
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

const expensesTabRegex = /(<div className="flex flex-col md:flex-row gap-4 mb-6">[\s\S]*?<div className="bg-\[\#131B2C\] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">)/;
content = content.replace(expensesTabRegex, `${rawMaterialChartCode}\n$1`);

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Updated admin/page.tsx with Raw Material Chart");
