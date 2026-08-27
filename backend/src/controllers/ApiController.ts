import express from 'express';
import { TransactionService } from '../services/TransactionService';
import { CashManagementService } from '../services/CashManagementService';
import { ReconciliationService } from '../services/ReconciliationService';
import { RefundService } from '../services/RefundService';
import { AuthService } from '../services/AuthService';
import { ProductService } from '../services/ProductService';
import { supabase } from '../config/database';

const router = express.Router();
const transactionService = new TransactionService();
const cashService = new CashManagementService();
const reconciliationService = new ReconciliationService();
const refundService = new RefundService();
const authService = new AuthService();
const productService = new ProductService();

// =======================
// INVENTORY & PRODUCTS
// =======================
router.get('/products', async (req, res) => {
    try {
        // POS / Customer view (only active)
        const products = await productService.getAllProducts(false);
        res.json(products);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/admin/products', async (req, res) => {
    try {
        const products = await productService.getAllProducts(true);
        res.json(products);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/admin/products', async (req, res) => {
    try {
        const product = await productService.createProduct(req.body);
        res.status(201).json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/admin/products/:id', async (req, res) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        res.json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/admin/products/:id', async (req, res) => {
    try {
        await productService.deleteProduct(req.params.id);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// =======================
// TRANSACTIONS & REFUNDS
// =======================
router.get('/transactions', async (req, res) => {
    try {
        const { startDate, endDate } = req.query as any;
        const transactions = await transactionService.getTransactionHistory(500, startDate, endDate);
        res.json(transactions);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/admin/transactions/:id', async (req, res) => {
    try {
        const trxId = req.params.id;
        
        // Cek apakah ada refund di cash_movements untuk mengembalikan saldo laci
        const { data: movements } = await supabase.from('cash_movements').select('*').eq('transaction_id', trxId).eq('type', 'refund');
        if (movements && movements.length > 0) {
            for (const mov of movements) {
                // Refund amount is negative, so we subtract it to add it back (or just -mov.amount)
                const { data: session } = await supabase.from('cash_sessions').select('expected_cash').eq('id', mov.session_id).single();
                if (session) {
                    const restoredCash = parseFloat(session.expected_cash) - mov.amount;
                    await supabase.from('cash_sessions').update({ expected_cash: restoredCash }).eq('id', mov.session_id);
                }
            }
        }
        
        // Hapus child tables terlebih dahulu jika tidak ada CASCADE
        await supabase.from('refunds').delete().eq('transaction_id', trxId);
        await supabase.from('cash_movements').delete().eq('transaction_id', trxId);
        await supabase.from('transaction_items').delete().eq('transaction_id', trxId);
        await supabase.from('order_items').delete().eq('transaction_id', trxId);
        
        // Hapus master table (transactions)
        const { error } = await supabase.from('transactions').delete().eq('id', trxId);
        if (error) throw error;
        
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/refunds', async (req, res) => {
    try {
        const { transaction_id, refund_amount, reason, requested_by } = req.body;
        // Direct approve for simplicity in this demo, or we can use the two-step
        const request = await refundService.requestRefund({ transaction_id, refund_amount, reason, requested_by });
        const approved = await refundService.approveRefund(request.id, requested_by);
        res.json(approved);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// =======================
// STAFF & AUTH (ADMIN ONLY)
// =======================
router.get('/staff', async (req, res) => {
    try {
        const staff = await authService.getStaffList();
        res.json(staff);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/staff', async (req, res) => {
    try {
        const staff = await authService.createStaff(req.body);
        res.status(201).json(staff);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/staff/:id/toggle', async (req, res) => {
    try {
        const { is_active } = req.body;
        const staff = await authService.toggleStaffStatus(req.params.id, is_active);
        res.json(staff);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/staff/:id', async (req, res) => {
    try {
        const result = await authService.updateStaff(req.params.id, req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/staff/:id', async (req, res) => {
    try {
        const result = await authService.deleteStaff(req.params.id);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// =======================
// PAYMENT METHODS
// =======================
router.get('/payment-methods', async (req, res) => {
    const { data, error } = await supabase.from('payment_methods').select('*').eq('is_active', true);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.put('/payment-methods/:id/toggle', async (req, res) => {
    const { is_active } = req.body;
    const { data, error } = await supabase
        .from('payment_methods')
        .update({ is_active })
        .eq('id', req.params.id)
        .select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// =======================
// TRANSACTIONS
// =======================
router.post('/payments/process', async (req, res) => {
    try {
        const result = await transactionService.createTransaction(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/payments/webhook/:providerId', async (req, res) => {
    try {
        await transactionService.handleWebhook(req.params.providerId, req.body);
        res.status(200).send('OK');
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// =======================
// REFUNDS
// =======================
router.post('/refunds/request', async (req, res) => {
    try {
        const result = await refundService.requestRefund(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/refunds/:id/approve', async (req, res) => {
    try {
        const { approvedBy, sessionId } = req.body;
        const result = await refundService.approveRefund(req.params.id, approvedBy, sessionId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// =======================
// CASH SESSIONS
// =======================
router.get('/health2', (req, res) => res.json({ status: 'v3' }));
router.get('/debug-sessions2', async (req, res) => { const { data, error } = await supabase.from('cash_sessions').select('*').order('created_at', { ascending: false }).limit(10); res.json({ data, error }); });
router.delete('/admin/cash-sessions/:id', async (req, res) => {
    try {
        await supabase.from('cash_movements').delete().eq('session_id', req.params.id);
        const { error } = await supabase.from('cash_sessions').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/admin/cash-sessions', async (req, res) => {
    try {
        const { data, error } = await supabase.from('cash_sessions').select('*').order('opened_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/cash-sessions/active', async (req, res) => {
    try {
        const { staffId, terminalId } = req.query;
        const session = await cashService.getActiveSession(String(staffId), String(terminalId));
        if (session) {
            res.json(session);
        } else {
            res.status(404).json({ error: 'No active session found' });
        }
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/fix-drawer', async (req, res) => {
    try {
        // Find the 20000 refund movement
        const { data: movements } = await supabase.from('cash_movements').select('*').eq('type', 'refund').eq('amount', -20000);
        if (!movements || movements.length === 0) return res.json({ message: 'No 20k refund found' });
        
        let fixed = 0;
        for (const m of movements) {
            // Delete movement
            await supabase.from('cash_movements').delete().eq('id', m.id);
            // Restore expected_cash
            const { data: session } = await supabase.from('cash_sessions').select('expected_cash').eq('id', m.session_id).single();
            if (session) {
                const newExpected = parseFloat(session.expected_cash) + 20000;
                await supabase.from('cash_sessions').update({ expected_cash: newExpected }).eq('id', m.session_id);
            }
            fixed++;
        }
        res.json({ message: `Fixed ${fixed} refunds of 20.000` });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/cash-sessions/open', async (req, res) => {
    try {
        const { staffId, terminalId, openingCash } = req.body;
        const session = await cashService.openSession(staffId, terminalId, openingCash);
        res.json(session);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/cash-sessions/close', async (req, res) => {
    try {
        const { sessionId, actualCash, discrepancyReason } = req.body;
        const session = await cashService.closeSession(sessionId, actualCash, discrepancyReason);
        res.json(session);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/cash-movements', async (req, res) => {
    try {
        await cashService.recordMovement(req.body);
        res.status(201).json({ success: true });
    } catch (error: any) {
         res.status(400).json({ error: error.message });
    }
});

// =======================
// REPORTS & AUDITS
// =======================
router.get('/reconciliation', async (req, res) => {
    try {
        const { startDate, endDate, mode } = req.query as any;
        // Default: today if no date given
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
        const start = startDate || todayStart.toISOString();
        const end = endDate || todayEnd.toISOString();
        const report = await reconciliationService.getReconciliationReport(start, end, mode);
        res.json(report);
    } catch (error: any) {
         res.status(400).json({ error: error.message });
    }
});

router.get('/audit-logs', async (req, res) => {
    const limit = parseInt(String(req.query.limit || '50'));
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

export default router;
