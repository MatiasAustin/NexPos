import { supabase } from '@/lib/supabase';
import axios from 'axios';

let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
if (typeof window !== 'undefined' && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
}

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getPaymentMethods = async () => {
    const res = await api.get('/payment-methods');
    return res.data;
};

export const processPayment = async (data: any) => {
    const res = await api.post('/payments/process', data);
    return res.data;
};

export const openCashSession = async (data: any) => {
    const res = await api.post('/cash-sessions/open', data);
    return res.data;
};

export const closeCashSession = async (data: any) => {
    const res = await api.post('/cash-sessions/close', data);
    return res.data;
};

export const getReconciliationReport = async (startDate?: string, endDate?: string) => {
    try {
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('id, amount_due, status, payment_method_id, created_at, payment_methods ( name, type )')
            .gte('created_at', startDate || new Date().toISOString())
            .lte('created_at', endDate || new Date().toISOString())
            .eq('status', 'Paid');

        if (error || !transactions) return [];

        const report: Record<string, any> = {};
        transactions.forEach((tx: any) => {
            const mName = tx.payment_methods?.name || 'Unknown';
            if (!report[mName]) {
                report[mName] = { method_name: mName, pos_total: 0, transaction_count: 0 };
            }
            report[mName].pos_total += Number(tx.amount_due || 0);
            report[mName].transaction_count += 1;
        });
        return Object.values(report);
    } catch(e) {
        console.error(e);
        return [];
    }
};

export const getAuditLogs = async (limit = 50) => {
    const res = await api.get(`/audit-logs?limit=${limit}`);
    return res.data;
};

// Products / Inventory
export const getActiveProducts = async () => {
    const res = await api.get(`/products`);
    return res.data;
};

export const getAdminProducts = async () => {
    const res = await api.get(`/admin/products`);
    return res.data;
};

export const createProduct = async (payload: any) => {
    const res = await api.post(`/admin/products`, payload);
    return res.data;
};

export const updateProduct = async (id: string, payload: any) => {
    const res = await api.put(`/admin/products/${id}`, payload);
    return res.data;
};

export const deleteProduct = async (id: string) => {
    const res = await api.delete(`/admin/products/${id}`);
    return res.data;
};

// Transactions & Refunds
export const getTransactions = async () => {
    const res = await api.get('/transactions');
    return res.data;
};

export const processRefund = async (payload: { transaction_id: string; refund_amount: number; reason: string; requested_by: string }) => {
    const res = await api.post('/refunds', payload);
    return res.data;
};

export default api;
