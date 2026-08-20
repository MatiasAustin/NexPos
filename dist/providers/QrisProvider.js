"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrisProvider = void 0;
const crypto_1 = __importDefault(require("crypto"));
class QrisProvider {
    config;
    initialize(config) {
        this.config = config;
    }
    async processPayment(transaction) {
        try {
            // In a real scenario, this makes an HTTP call to the Payment Gateway (e.g. Midtrans, Xendit).
            const apiKey = this.config.api_credentials.api_key;
            // Dummy implementation simulating a payment intent creation
            const providerTrxId = `QRIS-${crypto_1.default.randomBytes(8).toString('hex')}`;
            const qrString = `00020101021126620014COM.GOJEK.WWW011893600914...${transaction.amount_due}`; // Dummy QR
            return {
                success: true,
                status: 'Pending', // Wait for webhook
                provider_transaction_id: providerTrxId,
                metadata: {
                    qr_string: qrString
                }
            };
        }
        catch (error) {
            return {
                success: false,
                status: 'Failed',
                message: error.message
            };
        }
    }
    async checkStatus(transaction) {
        if (!transaction.provider_transaction_id) {
            return { status: transaction.status };
        }
        // Simulating checking status via API
        return {
            status: transaction.status,
            provider_transaction_id: transaction.provider_transaction_id
        };
    }
    async refund(transaction, amount) {
        // Simulating API call to refund QRIS
        return {
            success: true,
            message: 'QRIS refund successfully requested'
        };
    }
    async handleWebhook(payload) {
        // Parse incoming webhook to verify signature and get status
        const data = payload.parsedBody;
        // Very simplified logic
        if (data && data.transaction_id && data.status) {
            return {
                success: true,
                transaction_id: data.transaction_id,
                status: data.status === 'success' ? 'Paid' : 'Failed'
            };
        }
        return {
            success: false,
            message: 'Invalid webhook payload'
        };
    }
}
exports.QrisProvider = QrisProvider;
