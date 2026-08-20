"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundService = void 0;
const database_1 = require("../config/database");
const CashManagementService_1 = require("./CashManagementService");
class RefundService {
    cashService = new CashManagementService_1.CashManagementService();
    async requestRefund(payload) {
        const { data, error } = await database_1.supabase
            .from('refunds')
            .insert({
            transaction_id: payload.transaction_id,
            refund_amount: payload.refund_amount,
            reason: payload.reason,
            requested_by: payload.requested_by,
            status: 'pending'
        })
            .select('*')
            .single();
        if (error)
            throw error;
        return data;
    }
    async approveRefund(refundId, approvedBy, sessionId) {
        // 1. Fetch Refund
        const { data: refund, error: fetchError } = await database_1.supabase
            .from('refunds')
            .select('*, transactions(*)')
            .eq('id', refundId)
            .single();
        if (fetchError || !refund)
            throw new Error('Refund not found');
        if (refund.status !== 'pending')
            throw new Error('Refund is not pending');
        // 2. Process Refund based on Payment Method (Simplified)
        // If cash, decrease drawer balance via CashManagementService
        const trx = refund.transactions;
        const isCash = trx.payment_method_id; // In real app, check payment method type
        if (sessionId) {
            // Record cash movement for cash refund
            await this.cashService.recordMovement({
                session_id: sessionId,
                staff_id: approvedBy,
                type: 'refund',
                amount: -Math.abs(refund.refund_amount), // Negative for cash out
                reason: refund.reason,
                transaction_id: trx.id
            });
        }
        // 3. Update Refund & Transaction Status
        const { data, error } = await database_1.supabase
            .from('refunds')
            .update({ status: 'approved', approved_by: approvedBy })
            .eq('id', refundId)
            .select('*')
            .single();
        await database_1.supabase
            .from('transactions')
            .update({ status: 'Refunded' })
            .eq('id', trx.id);
        if (error)
            throw error;
        // Log Audit
        await database_1.supabase.from('audit_logs').insert({
            staff_id: approvedBy,
            action: 'approve_refund',
            entity_type: 'refund',
            entity_id: refundId,
            new_value: { status: 'approved' }
        });
        return data;
    }
}
exports.RefundService = RefundService;
