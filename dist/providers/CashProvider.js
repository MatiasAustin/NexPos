"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashProvider = void 0;
class CashProvider {
    config;
    initialize(config) {
        this.config = config;
    }
    async processPayment(transaction) {
        if (transaction.amount_received < transaction.amount_due) {
            return {
                success: false,
                status: 'Failed',
                message: 'Amount received is less than amount due'
            };
        }
        // Cash payments are immediately marked as Paid if enough cash is given.
        return {
            success: true,
            status: 'Paid',
            payment_reference: `CASH-${Date.now()}`
        };
    }
    async checkStatus(transaction) {
        // Cash transactions do not have an external status to check
        return {
            status: transaction.status
        };
    }
    async refund(transaction, amount) {
        // Cash refunds require manual drawer updates (handled by CashManagementService),
        // so provider just approves it.
        return {
            success: true,
            message: 'Cash refund approved'
        };
    }
    async handleWebhook(payload) {
        // Cash payments do not have webhooks
        return {
            success: false,
            message: 'Webhooks not supported for Cash provider'
        };
    }
}
exports.CashProvider = CashProvider;
