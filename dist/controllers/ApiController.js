"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const TransactionService_1 = require("../services/TransactionService");
const CashManagementService_1 = require("../services/CashManagementService");
const ReconciliationService_1 = require("../services/ReconciliationService");
const RefundService_1 = require("../services/RefundService");
const database_1 = require("../config/database");
const router = express_1.default.Router();
const transactionService = new TransactionService_1.TransactionService();
const cashService = new CashManagementService_1.CashManagementService();
const reconciliationService = new ReconciliationService_1.ReconciliationService();
const refundService = new RefundService_1.RefundService();
// =======================
// PAYMENT METHODS
// =======================
router.get('/payment-methods', async (req, res) => {
    const { data, error } = await database_1.supabase.from('payment_methods').select('*');
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
});
router.put('/payment-methods/:id/toggle', async (req, res) => {
    const { is_active } = req.body;
    const { data, error } = await database_1.supabase
        .from('payment_methods')
        .update({ is_active })
        .eq('id', req.params.id)
        .select('*');
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
});
// =======================
// TRANSACTIONS
// =======================
router.post('/payments/process', async (req, res) => {
    try {
        const result = await transactionService.createTransaction(req.body);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/payments/webhook/:providerId', async (req, res) => {
    try {
        await transactionService.handleWebhook(req.params.providerId, req.body);
        res.status(200).send('OK');
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/refunds/:id/approve', async (req, res) => {
    try {
        const { approvedBy, sessionId } = req.body;
        const result = await refundService.approveRefund(req.params.id, approvedBy, sessionId);
        res.json(result);
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/cash-sessions/close', async (req, res) => {
    try {
        const { sessionId, actualCash, discrepancyReason } = req.body;
        const session = await cashService.closeSession(sessionId, actualCash, discrepancyReason);
        res.json(session);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/cash-movements', async (req, res) => {
    try {
        await cashService.recordMovement(req.body);
        res.status(201).json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// =======================
// REPORTS & AUDITS
// =======================
router.get('/reconciliation', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reconciliationService.getReconciliationReport(startDate, endDate);
        res.json(report);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/audit-logs', async (req, res) => {
    const { data, error } = await database_1.supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
});
exports.default = router;
