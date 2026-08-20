import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
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
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate || startDate!);
    const res = await api.get(`/reconciliation?${params.toString()}`);
    return res.data;
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
