import express from 'express';
import { TransactionService } from '../services/TransactionService';
import { CashManagementService } from '../services/CashManagementService';
import { ReconciliationService } from '../services/ReconciliationService';
import { RefundService } from '../services/RefundService';
import { supabase } from '../config/database';

const router = express.Router();
const transactionService = new TransactionService();
const cashService = new CashManagementService();
const reconciliationService = new ReconciliationService();
const refundService = new RefundService();

// =======================
// PAYMENT METHODS
// =======================
router.get('/payment-methods', async (req, res) => {
    const { data, error } = await supabase.from('payment_methods').select('*');
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
        const { startDate, endDate } = req.query as any;
        const report = await reconciliationService.getReconciliationReport(startDate, endDate);
        res.json(report);
    } catch (error: any) {
         res.status(400).json({ error: error.message });
    }
});

router.get('/audit-logs', async (req, res) => {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

export default router;
