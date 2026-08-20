import express from 'express';
import { TransactionService } from '../services/TransactionService';
import { CashManagementService } from '../services/CashManagementService';

const router = express.Router();
const transactionService = new TransactionService();
const cashService = new CashManagementService();

// Process a payment
router.post('/payments/process', async (req, res) => {
    try {
        const result = await transactionService.createTransaction(req.body);
        
        // If it's cash and successful, record movement
        if (result.status === 'Paid') {
             // In reality we'd pull active session from auth token
             // cashService.recordMovement(...)
        }
        
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Webhook for digital payments
router.post('/payments/webhook/:providerId', async (req, res) => {
    try {
        await transactionService.handleWebhook(req.params.providerId, req.body);
        res.status(200).send('OK');
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Cash Session endpoints
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

export default router;
