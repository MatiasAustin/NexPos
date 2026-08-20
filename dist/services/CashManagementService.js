"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashManagementService = void 0;
const database_1 = require("../config/database");
class CashManagementService {
    async openSession(staffId, terminalId, openingCash) {
        const { data, error } = await database_1.supabase
            .from('cash_sessions')
            .insert({
            staff_id: staffId,
            terminal_id: terminalId,
            opening_cash: openingCash,
            expected_cash: openingCash,
            status: 'open'
        })
            .select('*')
            .single();
        if (error)
            throw error;
        return data;
    }
    async getActiveSession(staffId, terminalId) {
        const { data, error } = await database_1.supabase
            .from('cash_sessions')
            .select('*')
            .eq('staff_id', staffId)
            .eq('terminal_id', terminalId)
            .eq('status', 'open')
            .single();
        return data;
    }
    async recordMovement(payload) {
        // 1. Insert Movement
        const { error: moveError } = await database_1.supabase
            .from('cash_movements')
            .insert(payload);
        if (moveError)
            throw moveError;
        // 2. Update Expected Cash in Session
        // Use RPC or read->update in real app. We'll do read->update here for simplicity.
        const { data: session } = await database_1.supabase
            .from('cash_sessions')
            .select('expected_cash')
            .eq('id', payload.session_id)
            .single();
        if (session) {
            let newExpected = parseFloat(session.expected_cash) + payload.amount;
            await database_1.supabase
                .from('cash_sessions')
                .update({ expected_cash: newExpected })
                .eq('id', payload.session_id);
        }
        // 3. Log Audit
        if (['adjustment', 'withdrawal', 'expense'].includes(payload.type)) {
            await database_1.supabase.from('audit_logs').insert({
                staff_id: payload.staff_id,
                action: `cash_${payload.type}`,
                entity_type: 'cash_session',
                entity_id: payload.session_id,
                new_value: payload
            });
        }
    }
    async closeSession(sessionId, actualCash, discrepancyReason) {
        const { data: session, error: fetchError } = await database_1.supabase
            .from('cash_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
        if (fetchError || !session)
            throw new Error('Session not found');
        const expectedCash = parseFloat(session.expected_cash);
        const difference = actualCash - expectedCash;
        if (difference !== 0 && !discrepancyReason) {
            throw new Error('Discrepancy reason is required when actual cash does not match expected cash.');
        }
        const { data, error } = await database_1.supabase
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
        if (error)
            throw error;
        return data;
    }
}
exports.CashManagementService = CashManagementService;
