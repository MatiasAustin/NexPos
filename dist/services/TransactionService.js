"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const database_1 = require("../config/database");
const PaymentFactory_1 = require("../core/payment/PaymentFactory");
class TransactionService {
    async getPaymentMethod(id) {
        const { data, error } = await database_1.supabase
            .from('payment_methods')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            throw new Error('Payment method not found');
        }
        return data;
    }
    async createTransaction(payload) {
        // 1. Get Payment Method
        const methodConfig = await this.getPaymentMethod(payload.payment_method_id);
        const isCash = methodConfig.type.toLowerCase() === 'cash';
        const amountReceived = payload.amount_received || 0;
        const changeGiven = isCash ? Math.max(0, amountReceived - payload.amount_due) : 0;
        // 2. Create Transaction Record in DB
        const { data: trxData, error: trxError } = await database_1.supabase
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
        const transaction = trxData;
        // 3. Process with Provider
        const provider = PaymentFactory_1.PaymentFactory.getProvider(methodConfig);
        const result = await provider.processPayment(transaction);
        // 4. Update Transaction Status based on provider response
        const { error: updateError } = await database_1.supabase
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
    async handleWebhook(providerId, payload) {
        // This would find the correct provider, pass the payload, and update the transaction.
        // Omitting for brevity.
    }
}
exports.TransactionService = TransactionService;
