import fs from 'fs';

const filePath = 'd:\\WORK\\BUILD_APP\\NexPos\\frontend\\src\\app\\pos\\page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const oldUI = `                        {((paymentResult.transaction?.tax_amount || 0) > 0 || (paymentResult.tax_amount || 0) > 0) && (
                            <>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Subtotal</span>
                                    <span>Rp {((paymentResult.transaction?.amount_due || paymentResult.amount_due || 0) - (paymentResult.transaction?.tax_amount || paymentResult.tax_amount || 0)).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Pajak</span>
                                    <span>Rp {(paymentResult.transaction?.tax_amount || paymentResult.tax_amount || 0).toLocaleString('id-ID')}</span>
                                </div>
                            </>
                        )}`;

const newUI = `                        {((paymentResult.transaction?.discount_amount || 0) > 0 || (paymentResult.discount_amount || 0) > 0) && (
                            <div className="flex justify-between text-sm mb-1">
                                <span>Diskon</span>
                                <span>- Rp {(paymentResult.transaction?.discount_amount || paymentResult.discount_amount || 0).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {((paymentResult.transaction?.tax_amount || 0) > 0 || (paymentResult.tax_amount || 0) > 0) && (
                            <>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Subtotal</span>
                                    <span>Rp {((paymentResult.transaction?.subtotal || paymentResult.subtotal || 0)).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Pajak</span>
                                    <span>Rp {(paymentResult.transaction?.tax_amount || paymentResult.tax_amount || 0).toLocaleString('id-ID')}</span>
                                </div>
                            </>
                        )}`;

content = content.replace(oldUI, newUI);
fs.writeFileSync(filePath, content);
console.log("Patched print modal");
