import { supabase } from '../config/database';
import { CashManagementService } from './CashManagementService';

export class RefundService {
    private cashService = new CashManagementService();

    async requestRefund(payload: {
        transaction_id: string;
        refund_amount: number;
        reason: string;
        requested_by: string;
    }) {
        const { data, error } = await supabase
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

        if (error) throw error;
        return data;
    }

    async approveRefund(refundId: string, approvedBy: string, sessionId?: string) {
        // 1. Fetch Refund
        const { data: refund, error: fetchError } = await supabase
            .from('refunds')
            .select('*, transactions(*)')
            .eq('id', refundId)
            .single();

        if (fetchError || !refund) throw new Error('Refund not found');
        if (refund.status !== 'pending') throw new Error('Refund is not pending');

        const trx = refund.transactions as any;
        
        // Fetch payment method to check if it's cash
        const { data: pmData } = await supabase.from('payment_methods').select('name').eq('id', trx.payment_method_id).single();
        const isCash = pmData && (pmData.name.toLowerCase().includes('cash') || pmData.name.toLowerCase().includes('tunai'));
        
        let activeSessionId = sessionId;
        if (!activeSessionId) {
            const { data: sessions } = await supabase.from('cash_sessions').select('id').eq('status', 'open').order('opened_at', { ascending: false }).limit(1);
            if (sessions && sessions.length > 0) activeSessionId = sessions[0].id;
        }

        if (activeSessionId && isCash) {
             // Record cash movement for cash refund
             await this.cashService.recordMovement({
                 session_id: activeSessionId,
                 staff_id: approvedBy,
                 type: 'refund',
                 amount: -Math.abs(refund.refund_amount), // Negative for cash out
                 reason: refund.reason,
                 transaction_id: trx.id
             });
        }

        // 3. Update Refund & Transaction Status
        const { data, error } = await supabase
            .from('refunds')
            .update({ status: 'approved', approved_by: approvedBy })
            .eq('id', refundId)
            .select('*')
            .single();

        await supabase
             .from('transactions')
             .update({ status: 'Refunded' })
             .eq('id', trx.id);

        if (error) throw error;
        
        // Log Audit
        await supabase.from('audit_logs').insert({
             staff_id: approvedBy,
             action: 'approve_refund',
             entity_type: 'refund',
             entity_id: refundId,
             new_value: { status: 'approved' }
        });

        return data;
    }
}
