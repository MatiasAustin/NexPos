import { supabase } from '../config/database';
import { PaymentFactory } from '../core/payment/PaymentFactory';
import { Transaction, PaymentProviderConfig } from '../core/payment/PaymentProvider.interface';

export class TransactionService {
    
    async getPaymentMethod(id: string): Promise<PaymentProviderConfig> {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new Error('Payment method not found');
        }

        return data as PaymentProviderConfig;
    }

    async createTransaction(payload: {
        order_reference: string;
        amount_due: number;
        amount_received?: number;
        payment_method_id: string;
    }) {
        // 1. Get Payment Method
        const methodConfig = await this.getPaymentMethod(payload.payment_method_id);

        const isCash = methodConfig.type.toLowerCase() === 'cash';
        const amountReceived = payload.amount_received || 0;
        const changeGiven = isCash ? Math.max(0, amountReceived - payload.amount_due) : 0;

        // 2. Create Transaction Record in DB
        const { data: trxData, error: trxError } = await supabase
            .from('transactions')
            .insert({
                order_reference: payload.order_reference,
                amount_due: payload.amount_due,
                amount_received: amountReceived,
                change_given: changeGiven,
                status: 'Pending',
                payment_method_id: payload.payment_method_id,
            })
            .select('*')
            .single();

        if (trxError || !trxData) {
            throw new Error(`Failed to create transaction: ${trxError?.message}`);
        }

        const transaction = trxData as Transaction;

        // 3. Process with Provider
        const provider = PaymentFactory.getProvider(methodConfig);
        const result = await provider.processPayment(transaction);

        // 4. Update Transaction Status based on provider response
        const { error: updateError } = await supabase
            .from('transactions')
            .update({
                status: result.status,
                provider_transaction_id: result.provider_transaction_id,
                payment_reference: result.payment_reference,
                updated_at: new Date()
            })
            .eq('id', transaction.id);

        if (updateError) {
             throw new Error(`Failed to update transaction status: ${updateError.message}`);
        }

        return {
            transaction_id: transaction.id,
            status: result.status,
            metadata: result.metadata,
            change_given: changeGiven
        };
    }

    async handleWebhook(providerId: string, payload: any) {
         // This would find the correct provider, pass the payload, and update the transaction.
         // Omitting for brevity.
    }
}
