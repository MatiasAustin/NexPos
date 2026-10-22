import { supabase } from '../config/database';

export class CashManagementService {
    
    async openSession(staffId: string, terminalId: string, openingCash: number) {
        let storeId: string | null = null;
        try {
            const { data: staff } = await supabase.from('staff_profiles').select('store_id').eq('id', staffId).single();
            if (staff?.store_id) storeId = staff.store_id;
        } catch(e) {}

        const { data, error } = await supabase
            .from('cash_sessions')
            .insert({
                staff_id: staffId,
                terminal_id: terminalId,
                opening_cash: openingCash,
                expected_cash: openingCash,
                status: 'open',
                store_id: storeId
            })
            .select('*')
            .single();
            
        if (error) throw error;
        return data;
    }

    async getActiveSession(staffId: string, terminalId: string) {
        const { data, error } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('staff_id', staffId)
            .eq('terminal_id', terminalId)
            .eq('status', 'open')
            .order('opened_at', { ascending: false })
            .limit(1);
            
        if (data && data.length > 0) {
            const session = data[0];
            // Calculate total_expense from expenses table (more reliable than cash_movements)
            const { data: expenses } = await supabase
                .from('expenses')
                .select('amount')
                .eq('store_id', session.store_id)
                .gte('created_at', session.opened_at);
            session.total_expense = expenses ? expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0) : 0;
            // Calculate total_refund from refunds table
            const { data: refunds } = await supabase
                .from('refunds')
                .select('refund_amount')
                .in('status', ['APPROVED', 'approved', 'Approved'])
                .eq('store_id', session.store_id)
                .gte('created_at', session.opened_at);
            session.total_refund = refunds ? refunds.reduce((sum: number, r: any) => sum + Number(r.refund_amount), 0) : 0;
            return session;
        }
        return null;
    }

    async recordMovement(payload: {
        session_id: string;
        staff_id: string;
        type: 'sale' | 'refund' | 'cash_in' | 'cash_out' | 'withdrawal' | 'adjustment' | 'expense';
        amount: number;
        reason?: string;
        note?: string;
        transaction_id?: string;
        store_id?: string;
    }) {
        let storeId = payload.store_id;
        if (!storeId && payload.session_id) {
            try {
                const { data: sess } = await supabase.from('cash_sessions').select('store_id').eq('id', payload.session_id).single();
                if (sess?.store_id) storeId = sess.store_id;
            } catch(e) {}
        }

        // 1. Insert Movement
        const { error: moveError } = await supabase
            .from('cash_movements')
            .insert({ ...payload, store_id: storeId || null });

        if (moveError) throw moveError;

        // 2. Update Expected Cash in Session
        // Use RPC or read->update in real app. We'll do read->update here for simplicity.
        const { data: session } = await supabase
            .from('cash_sessions')
            .select('expected_cash')
            .eq('id', payload.session_id)
            .single();

        if (session) {
            let newExpected = parseFloat(session.expected_cash) + payload.amount;
            await supabase
                .from('cash_sessions')
                .update({ expected_cash: newExpected })
                .eq('id', payload.session_id);
        }

        // 3. Log Audit
        if (['adjustment', 'withdrawal', 'expense'].includes(payload.type)) {
            await supabase.from('audit_logs').insert({
                staff_id: payload.staff_id,
                action: `cash_${payload.type}`,
                entity_type: 'cash_session',
                entity_id: payload.session_id,
                new_value: payload
            });
        }
    }

    async closeSession(sessionId: string, actualCash: number, discrepancyReason?: string) {
        const { data: session, error: fetchError } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (fetchError || !session) throw new Error('Session not found');
        
        const expectedCash = parseFloat(session.expected_cash);
        const difference = actualCash - expectedCash;

        if (difference !== 0 && !discrepancyReason) {
            throw new Error('Discrepancy reason is required when actual cash does not match expected cash.');
        }

        const { data, error } = await supabase
            .from('cash_sessions')
            .update({
                actual_cash: actualCash,
                difference: difference,
                discrepancy_reason: discrepancyReason,
                status: 'closed',
                closed_at: new Date()
            })
            .eq('id', sessionId)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    }
}
