import { supabase } from '../config/database';

export class ReconciliationService {
    async getReconciliationReport(startDate: string, endDate: string) {
        // Fetch all transactions within the date range
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
                id, amount_due, status, payment_method_id,
                payment_methods ( name, type )
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .eq('status', 'Paid');

        if (error) throw error;

        // Group by payment method
        const report: Record<string, {
            method_name: string;
            pos_total: number;
            transaction_count: number;
        }> = {};

        transactions.forEach((trx: any) => {
            const methodId = trx.payment_method_id;
            const methodName = trx.payment_methods.name;
            const amount = parseFloat(trx.amount_due);

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

        // In a real application, you would also fetch data from provider APIs
        // to compare POS Total vs Provider Total. We return POS totals here.
        return Object.values(report);
    }
}
