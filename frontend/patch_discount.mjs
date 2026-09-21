import fs from 'fs';

const filePath = 'd:\\WORK\\BUILD_APP\\NexPos\\frontend\\src\\app\\pos\\page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 2. clearCart
content = content.replace(
    `        setCustomerName("");\n    };`,
    `        setCustomerName("");\n        setDiscountValue("");\n    };`
);

// 3. Cart logic
content = content.replace(
    `    const subTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);\n    const taxRate = storeSettings?.tax_enabled ? Number(storeSettings?.tax_rate || 0) : 0;\n    const taxAmount = (subTotal * taxRate) / 100;\n    const grandTotal = subTotal + taxAmount;`,
    `    const subTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);\n    const calculatedDiscount = discountType === "percentage" ? (subTotal * (Number(discountValue) || 0)) / 100 : (Number(discountValue) || 0);\n    const discountedSubTotal = Math.max(0, subTotal - calculatedDiscount);\n    const taxRate = storeSettings?.tax_enabled ? Number(storeSettings?.tax_rate || 0) : 0;\n    const taxAmount = (discountedSubTotal * taxRate) / 100;\n    const grandTotal = discountedSubTotal + taxAmount;`
);

// 4. loadCustomerOrder draft payload
content = content.replace(
    `            const draftOrder = {\n                queue_number: activeQueueNumber || \`Draft-\${Date.now().toString().slice(-4)}\`,\n                customer_name: customerName,\n                items: cart,\n                total: currentSubTotal + currentTaxAmount,\n                status: 'draft'\n            };`,
    `            const draftOrder = {\n                queue_number: activeQueueNumber || \`Draft-\${Date.now().toString().slice(-4)}\`,\n                customer_name: customerName,\n                items: cart,\n                total: grandTotal,\n                discount_amount: calculatedDiscount,\n                status: 'draft'\n            };`
);

// 5. handleSaveDraft draft payload
content = content.replace(
    `        const currentSubTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);\n        const currentTaxRate = storeSettings?.tax_enabled ? Number(storeSettings?.tax_rate || 0) : 0;\n        const currentTaxAmount = (currentSubTotal * currentTaxRate) / 100;\n\n        const draftOrder = {\n            queue_number: orderRef,\n            customer_name: customerName,\n            items: cart,\n            total: currentSubTotal + currentTaxAmount,\n            status: 'draft'\n        };`,
    `        const draftOrder = {\n            queue_number: orderRef,\n            customer_name: customerName,\n            items: cart,\n            total: grandTotal,\n            discount_amount: calculatedDiscount,\n            status: 'draft'\n        };`
);

// 6. Payment printing object
content = content.replace(
    `        const printTx = {\n            order_reference: orderRef,\n            customer_name: customerName,\n            total: currentSubTotal + currentTaxAmount,\n            subtotal: currentSubTotal,\n            tax_amount: currentTaxAmount,\n            discount_amount: 0,\n            amount_due: currentSubTotal + currentTaxAmount,\n            status: 'BELUM LUNAS'\n        };`,
    `        const printTx = {\n            order_reference: orderRef,\n            customer_name: customerName,\n            total: grandTotal,\n            subtotal: subTotal,\n            tax_amount: taxAmount,\n            discount_amount: calculatedDiscount,\n            amount_due: grandTotal,\n            status: 'BELUM LUNAS'\n        };`
);

// 7. loadCustomerOrder restore discount
content = content.replace(
    `        setCustomerName(order.customer_name || "");\n    };`,
    `        setCustomerName(order.customer_name || "");\n        if (order.discount_amount) {\n            setDiscountType("nominal");\n            setDiscountValue(order.discount_amount.toString());\n        } else {\n            setDiscountValue("");\n        }\n    };`
);

// 8. Payment payload logic
content = content.replace(
    `                tax_amount: taxAmount,\n                customer_name: customerName,\n                payment_method_id: selectedMethod.id,`,
    `                tax_amount: taxAmount,\n                discount_amount: calculatedDiscount,\n                customer_name: customerName,\n                payment_method_id: selectedMethod.id,`
);
content = content.replace(
    `                    tax_amount: payload.tax_amount || 0,\n                    customer_name: payload.customer_name || null,`,
    `                    tax_amount: payload.tax_amount || 0,\n                    discount_amount: payload.discount_amount || 0,\n                    customer_name: payload.customer_name || null,`
);
content = content.replace(
    `        setPaymentResult({\n            transaction: { ...result, subtotal: subTotal, customer_name: customerName },`,
    `        setPaymentResult({\n            transaction: { ...result, subtotal: subTotal, discount_amount: calculatedDiscount, customer_name: customerName },`
);

// 9. UI Updates (Cart Summary)
const oldUI = `<div className="flex justify-between items-center text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            <span>Subtotal</span>
                                            <span>Rp {subTotal.toLocaleString("id-ID")}</span>
                                        </div>
                                        {taxRate > 0 && (
                                            <div className="flex justify-between items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                                                <span>Pajak ({taxRate}%)</span>
                                                <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
                                            </div>
                                        )}`;

const newUI = `<div className="flex justify-between items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                            <span>Subtotal</span>
                                            <span>Rp {subTotal.toLocaleString("id-ID")}</span>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">Diskon:</span>
                                            <select 
                                                value={discountType} 
                                                onChange={(e: any) => { setDiscountType(e.target.value); setDiscountValue(""); }}
                                                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded p-1 text-sm focus:ring-blue-500"
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
                                                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded p-1 text-sm focus:ring-blue-500"
                                            />
                                        </div>
                                        {calculatedDiscount > 0 && (
                                            <div className="flex justify-between items-center text-sm font-semibold text-red-500 dark:text-red-400 mb-2">
                                                <span>Potongan Diskon</span>
                                                <span>- Rp {calculatedDiscount.toLocaleString("id-ID")}</span>
                                            </div>
                                        )}

                                        {taxRate > 0 && (
                                            <div className="flex justify-between items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                                <span>Pajak ({taxRate}%)</span>
                                                <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
                                            </div>
                                        )}`;

content = content.replace(oldUI, newUI);

fs.writeFileSync(filePath, content);
console.log('Patched pos/page.tsx with logic and UI');
