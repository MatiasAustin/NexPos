import fs from 'fs';

const filePath = 'd:\\WORK\\BUILD_APP\\NexPos\\frontend\\src\\app\\pos\\page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');
content = content.replace(/\r\n/g, '\n');

const oldUI = `                    <div className="flex justify-between mb-2">
                        <span className="text-gray-400 text-sm md:text-base">Subtotal</span>
                        <span className="font-bold text-lg md:text-xl text-gray-200">Rp {subTotal.toLocaleString("id-ID")}</span>
                    </div>
                    {storeSettings?.tax_enabled && (`;

const newUI = `                    <div className="flex justify-between mb-2">
                        <span className="text-gray-400 text-sm md:text-base">Subtotal</span>
                        <span className="font-bold text-lg md:text-xl text-gray-200">Rp {subTotal.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm md:text-base">Diskon</span>
                        <div className="flex gap-2 w-1/2 justify-end">
                            <select 
                                value={discountType} 
                                onChange={(e: any) => { setDiscountType(e.target.value); setDiscountValue(""); }}
                                className="bg-[#1a1a1c] border border-gray-600 text-white rounded p-1 text-sm focus:ring-blue-500 w-16"
                            >
                                <option value="nominal">Rp</option>
                                <option value="percentage">%</option>
                            </select>
                            <input 
                                type="number"
                                min="0"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                placeholder={discountType === 'percentage' ? "0-100" : "Nominal"}
                                className="bg-[#1a1a1c] border border-gray-600 text-white rounded p-1 text-sm focus:ring-blue-500 w-full text-right"
                            />
                        </div>
                    </div>
                    {calculatedDiscount > 0 && (
                        <div className="flex justify-between mb-2 text-red-400">
                            <span className="text-sm md:text-base">Potongan</span>
                            <span className="font-bold text-lg md:text-xl">- Rp {calculatedDiscount.toLocaleString("id-ID")}</span>
                        </div>
                    )}
                    {storeSettings?.tax_enabled && (`;

content = content.replace(oldUI, newUI);
fs.writeFileSync(filePath, content);
console.log("Patched cart UI");
