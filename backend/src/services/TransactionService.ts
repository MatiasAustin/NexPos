import { supabase } from '../config/database';


export interface PaymentProviderConfig {
    id: string;
    name: string;
    type: 'CASH' | 'QRIS' | 'EDC' | 'TRANSFER';
    is_active: boolean;
    provider_settings: any;
}

export class TransactionService {
    async getPaymentProviders(): Promise<PaymentProviderConfig[]> {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('is_active', true);
            
        if (error) throw new Error(error.message);
        return data as PaymentProviderConfig[];
    }

    async processPayment(payload: {
        order_reference: string;
        amount_due: number;
        amount_received: number;
        tax_amount?: number;
        customer_name?: string;
        payment_method_id: string;
        provider_transaction_id?: string;
        payment_reference?: string;
        items?: any[]; // The cart items: { product_id, product_name, quantity, price, cogs }
        staff_name?: string;
    }) {
        const { order_reference, amount_due, amount_received, tax_amount, customer_name, payment_method_id, items, staff_name } = payload;
        
        const change_given = amount_received >= amount_due ? amount_received - amount_due : 0;
        const status = amount_received >= amount_due ? 'Paid' : 'Pending';

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                order_reference,
                amount_due,
                amount_received,
                change_given,
                tax_amount: tax_amount || 0,
                customer_name: customer_name || null,
                status,
                payment_method_id,
                provider_transaction_id: payload.provider_transaction_id,
                payment_reference: payload.payment_reference
            })
            .select('*')
            .single();

        if (error) {
            throw new Error(`Failed to process payment: ${error.message}`);
        }

        // Process order items if provided
        if (items && items.length > 0) {
            const orderItems = items.map(item => ({
                transaction_id: data.id,
                product_id: item.product_id,
                product_name: item.name || item.product_name,
                quantity: item.quantity,
                price_at_time: item.price,
                cogs_at_time: item.cogs || 0
            }));
            
            await supabase.from('order_items').insert(orderItems);
            // Deduct stock for each product and its ingredients
            for (const item of items) {
                if (item.product_id) {
                    const { data: prod } = await supabase.from('products').select('stock, ingredients').eq('id', item.product_id).single();
                    if (prod) {
                        // Deduct product stock
                        await supabase.from('products')
                            .update({ stock: prod.stock - item.quantity })
                            .eq('id', item.product_id);
                            
                        // Deduct ingredients / raw materials
                        if (prod.ingredients && Array.isArray(prod.ingredients)) {
                            for (const ing of prod.ingredients) {
                                const matId = ing.raw_material_id || ing.id;
                                if (matId && ing.qty > 0) {
                                    const { data: rawMat } = await supabase.from('raw_materials').select('current_stock, name').eq('id', matId).single();
                                    if (rawMat) {
                                        const totalQtyUsed = ing.qty * item.quantity;
                                        const newStock = rawMat.current_stock - totalQtyUsed;
                                        
                                        await supabase.from('raw_materials')
                                            .update({ current_stock: newStock })
                                            .eq('id', matId);
                                            
                                        // Log stock reduction
                                        await supabase.from('material_stock_logs').insert([{
                                            material_id: matId,
                                            material_name: rawMat.name,
                                            delta: -totalQtyUsed,
                                            current_stock: newStock,
                                            note: `Terpotong untuk Penjualan ${item.product_name || item.name} (Ref: ${order_reference})`,
                                            staff_name: payload.staff_name || 'System'
                                        }]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return data;
    }

    async getTransactionHistory(limit: number = 50, startDate?: string, endDate?: string) {
        let query = supabase
            .from('transactions')
            .select(`
                *,
                payment_methods ( name, type ),
                order_items ( product_id, product_name, quantity, price_at_time, cogs_at_time )
            `)
            .order('created_at', { ascending: false });
            
        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);
        
        const { data, error } = await query.limit(limit);

        if (error) throw new Error(error.message);
        return data;
    }

    async getPaymentProviderConfig(payment_method_id: string): Promise<PaymentProviderConfig> {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', payment_method_id)
            .single();
            
        if (error) throw new Error(error.message);
        return data as PaymentProviderConfig;
    }

    async createTransaction(payload: {
        order_reference: string;
        amount_due: number;
        amount_received: number;
        tax_amount?: number;
        customer_name?: string;
        payment_method_id: string;
        provider_transaction_id?: string;
        payment_reference?: string;
        items?: any[];
    }) {
        // We can just reuse processPayment for createTransaction as it essentially does the same DB insert
        // but typically createTransaction leaves it as Pending. Our processPayment handles status automatically.
        // Let's explicitly set amount_received to 0 for creation if not provided so it stays Pending
        return this.processPayment({
            ...payload,
            amount_received: payload.amount_received || 0
        });
    }

    async updateTransactionStatus(transaction_id: string, status: string, provider_data?: any) {
        const { data, error } = await supabase
            .from('transactions')
            .update({ 
                status,
                ...(provider_data ? { provider_transaction_id: provider_data.id } : {})
            })
            .eq('id', transaction_id)
            .select('*')
            .single();

        if (error) throw new Error(`Failed to update transaction: ${error.message}`);
        return data;
    }

    async handleWebhook(providerId: string, eventData: any) {
        console.log(`Received webhook for provider ${providerId}`, eventData);
        return { success: true };
    }
}
