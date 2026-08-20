import { supabase } from '../config/database';

export class ReconciliationService {
    async getReconciliationReport(startDate: string, endDate: string, mode?: string) {
        // Build date range. endDate should cover the end of the day.
        const startISO = new Date(startDate + 'T00:00:00Z').toISOString();
        const endISO = new Date(endDate + 'T23:59:59Z').toISOString();

        // Fetch all transactions within the date range
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
                id, amount_due, status, payment_method_id, created_at,
                payment_methods ( name, type )
            `)
            .gte('created_at', startISO)
            .lte('created_at', endISO)
            .eq('status', 'Paid');

        if (error) throw error;

        // Group by payment method
        const report: Record<string, {
            method_name: string;
            pos_total: number;
            transaction_count: number;
        }> = {};

        (transactions || []).forEach((trx: any) => {
            const methodId = trx.payment_method_id || 'unknown';
            const methodName = trx.payment_methods?.name || 'Unknown';
            const amount = parseFloat(trx.amount_due) || 0;

            if (!report[methodId]) {
                report[methodId] = {
                    method_name: methodName,
                    pos_total: 0,
                    transaction_count: 0
                };
            }

            report[methodId].pos_total += amount;
            report[methodId].transaction_count += 1;
        });

        return Object.values(report);
    }
}
