import { supabase } from '../config/database';
import { PaymentProviderFactory } from '../providers/PaymentProviderFactory';

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
        payment_method_id: string;
        provider_transaction_id?: string;
        payment_reference?: string;
        items?: any[]; // The cart items: { product_id, product_name, quantity, price, cogs }
    }) {
        const { order_reference, amount_due, amount_received, payment_method_id, items } = payload;
        
        const change_given = amount_received >= amount_due ? amount_received - amount_due : 0;
        const status = amount_received >= amount_due ? 'Paid' : 'Pending';

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                order_reference,
                amount_due,
                amount_received,
                change_given,
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
            
            // Deduct stock for each product
            for (const item of items) {
                if (item.product_id) {
                    const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                    if (prod) {
                        await supabase.from('products')
                            .update({ stock: prod.stock - item.quantity })
                            .eq('id', item.product_id);
                    }
                }
            }
        }

        return data;
    }

    async getTransactionHistory(limit: number = 50) {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                payment_methods ( name, type ),
                order_items ( product_id, product_name, quantity, price_at_time )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw new Error(error.message);
        return data;
    }
}
